import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LngLat, LngLatBounds, LngLatLike } from 'mapbox-gl';
import { BehaviorSubject, from, merge, Observable, ReplaySubject, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, first, map, switchMap, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Card, Response } from './common/datatypes';
import { ResponsesService } from './responses.service';
import { Location } from '@angular/common';

export type GeoType = [number, number, number] | [[number, number], [number, number]] | null;

export type State = {
  geo?: GeoType;
  searchBoxTitle?: string,
  cardId?: string | null,
  placeId?: string | null,
  responseId?: string | null,
  skipGeoUpdate?: boolean,
  situations?: string[][] | null,
};

function makeKey(obj: any, keys: string[]) {
  const ret = [];
  for (const key of keys) {
    ret.push(JSON.stringify(obj.hasOwnProperty(key)? obj[key] : null));
  }
  return ret.join(':');
}

function keyComparer(keys: string[]) {
  return (x: Object, y: Object) => makeKey(x, keys) === makeKey(y, keys);
}

@Injectable({
  providedIn: 'root'
})
export class StateService {
  _state: State = {}; 
  state = new ReplaySubject<State>(1);
  currentState: string = '_';
  geoChanges: Observable<State>;
  filterChanges: Observable<State>;
  queryChanges: Observable<State>;
  selectedService = new ReplaySubject<{service: Card | null, preview: boolean}>(1);
  savedGeo: [number, number, number] | null;
  latestBounds: LngLatBounds;

  constructor(private api: ApiService, private responses: ResponsesService, private location: Location) {
    // State stream - only for geo view changes
    this.geoChanges = this.state.pipe(
      distinctUntilChanged<State>(keyComparer(['geo'])),
    );
    this.filterChanges = this.state.pipe(
      distinctUntilChanged<State>(keyComparer(['responseId', 'situations'])),
    );
    this.queryChanges = this.state.pipe(
      distinctUntilChanged<State>(keyComparer(['searchBoxTitle'])),
    );
    // State stream - for first time item fetching
    this.state.pipe(
      first(),
      filter((state) => !!state.cardId),
      switchMap((state) => this.api.getCard(state.cardId as string))
    ).subscribe((service: Card) => {
      // console.log('FIRST TIME - Fetched', service);
      this.selectService(service);
    });
  }

  trackRoute(router: Router, activatedRoute: ActivatedRoute) {
    // State decoding from URL
    merge(
      activatedRoute.queryParams,
      activatedRoute.url
    ).pipe(
      map(() => activatedRoute.snapshot),
      switchMap((sn) => {
        const responseId = sn.params.response || null;
        const placeId = sn.params.place || null;
        const cardId = sn.params.card || null;
        const state = sn.queryParams.state || '';
        return this.processPaths(responseId, placeId, cardId, state);
      }),
      filter((state) => {
        return state !== this.currentState;          
      }),
      map((state) => {
        this.currentState = state;
        const decoded = this.decode(state);
        console.log('D:STATE', state, '->', decoded);
        return decoded
      })
    ).subscribe((state: State) => {
      this._state = Object.assign({}, this._state, state);
      this.state.next(this._state);
    });

    this.state.subscribe(state => {
      const encoded = this.encode(state);
      this.currentState = encoded;
      const queryParams = {
        state: encoded
      };
      // const qp = `?g=${encodeURIComponent(queryParams.g)}` +
      //   `&f=${encodeURIComponent(queryParams.f)}` +
      //   `&q=${encodeURIComponent(queryParams.q)}`;
      //   console.log('E:STATE', state, '->', path, queryParams);
      //   // router.navigateByUrl(path + qp);
      // const jp = path.join('/');
      // const cp = this.location.path().split('?')[0];
      // if (jp !== cp) {
      //   console.log('PUSH TO HISTORY', cp, jp + qp);
      //   this.location.go(jp + qp);
      // } else {
      //   console.log('REPLACE TO HISTORY', jp + qp);
      //   this.location.replaceState(jp + qp);
      // }
      router.navigate(['/'], {queryParams, replaceUrl: true});
    });
  }

  processPaths(responseId: string, placeId: string, cardId: string, encoded: string): Observable<string> {
    if (!!responseId || !!placeId || !!cardId) {
      const decoded = this.decode(encoded);
      let obs: Observable<State> = from([]);
      if (!!responseId) {
        obs = this.api.getResponse(responseId).pipe(
          map((response) => {
            decoded.responseId = responseId;
            decoded.searchBoxTitle = response.name;
            decoded.cardId = null;
            decoded.placeId = null;
            return decoded;
          })
        );
      } else if (!!placeId) {
        obs = this.api.getPlace(placeId).pipe(
          map((place) => {
            decoded.geo = [[place.bounds[0], place.bounds[1]], [place.bounds[2], place.bounds[3]]];
            decoded.searchBoxTitle = place.name[0];
            decoded.cardId = null;
            decoded.placeId = placeId;
            decoded.responseId = null;
            return decoded;
          })
        );
      } else if (!!cardId) {
        decoded.responseId = null;
        decoded.cardId = cardId;
        decoded.placeId = null;
        obs = from([
          decoded          
        ]);
      }
      return obs.pipe(
        map((state) => {
          return this.encode(state);
        })
      );
    } else {
      return from([encoded]);
    }
  }
  
  encode(state: State) {
    const prepared = [
      state.geo || null,
      state.searchBoxTitle || null,
      state.cardId || null,
      state.responseId || null,
      state.situations || null,
    ];
    return JSON.stringify(prepared);
  }
  
  decode(state: string): State {
    if (state) {
      try {
        const prepared = JSON.parse(state);
        return {
          geo: prepared[0] || null,
          searchBoxTitle: prepared[1] || '',
          cardId: prepared[2] || null,
          responseId: prepared[3] || null,
          situations: prepared[4] || null,
        };
      } catch (e) {
        console.log('DECODE ERROR', e);
      }
    }
    return {};
  }

  // decode(encoded: {responseId: string, placeId: string, cardId: string, queryText: string, geo: string, situations: string}): Observable<State> {
  //   let pSituations: string[][] | null = null;
  //   try {
  //     pSituations = JSON.parse(encoded.situations);
  //   } catch (e) {
  //     pSituations = null;
  //   }
  //   let pGeo: GeoType = null;
  //   try {
  //     pGeo = JSON.parse(encoded.geo);
  //   } catch (e) {
  //     pGeo = null;
  //   }

  //   if (encoded.responseId) {
  //     if (!encoded.queryText) {
  //       return this.api.getResponse(encoded.responseId).pipe(
  //         map((response) => {
  //           return {
  //             geo: pGeo,
  //             responseId: encoded.responseId,
  //             cardId: null,
  //             placeId: null,
  //             searchBoxTitle: response.name,
  //             situations: pSituations,
  //           };
  //         })
  //       );
  //     } else {
  //       return from([
  //         {
  //           geo: pGeo,
  //           responseId: encoded.responseId,
  //           cardId: null,
  //           placeId: null,
  //           searchBoxTitle: encoded.queryText,
  //           situations: pSituations,
  //         }
  //       ]);
  //     }
  //   }
  //   if (encoded.cardId) {
  //     return from([
  //       {
  //         geo: pGeo,
  //         responseId: null,
  //         cardId: encoded.cardId,
  //         placeId: null,
  //         searchBoxTitle: encoded.queryText,
  //         situations: pSituations,
  //       }
  //     ]);
  //   }
  //   if (encoded.placeId) {
  //     if (!encoded.geo) {
  //       return this.api.getPlace(encoded.placeId).pipe(
  //         map((place) => {
  //           return {
  //             geo: [[place.bounds[0], place.bounds[1]], [place.bounds[2], place.bounds[3]]],
  //             responseId: null,
  //             cardId: null,
  //             placeId: encoded.placeId,
  //             searchBoxTitle: place.name[0],
  //             situations: pSituations,
  //           };
  //         })
  //       );
  //     } else {
  //       return from([
  //         {
  //           geo: pGeo,
  //           responseId: null,
  //           cardId: null,
  //           placeId: encoded.placeId,
  //           searchBoxTitle: encoded.queryText,
  //           situations: pSituations,
  //         }
  //       ]);
  //     }
  //   }
  //   return from([{
  //     geo: pGeo,
  //     responseId: null,
  //     cardId: null,
  //     placeId: null,
  //     searchBoxTitle: encoded.queryText,
  //     situations: pSituations,
  //   }]);
  // }

  set bounds(bounds: LngLatBounds) {
    const geo = bounds.toArray();
    this._state = Object.assign({}, this._state, {geo, skipGeoUpdate: false});
    this.state.next(this._state);
  }

  updateCenterZoom(geo: [number, number, number], skipGeoUpdate=false) {
    geo = geo.map(x => Math.round(x * 10000) / 10000) as [number, number, number];
    this._state = Object.assign({}, this._state, {geo, skipGeoUpdate});
    this.state.next(this._state);
  }

  set centerZoom(centerZoom: [number, number, number]) {
    this.updateCenterZoom(centerZoom);
  }

  // set searchBoxTitle(searchBoxTitle: string) {
  //   this._state = Object.assign({}, this._state, {searchBoxTitle});
  //   this.state.next(this._state);
  // }

  set cardId(cardId: string | null) {
    this._state = Object.assign({}, this._state, {cardId});
    this.state.next(this._state);
  }

  set responseFilter(responseId: string | null) {
    const searchBoxTitle = responseId ? this.responses.getResponseName(responseId) : '';
    this._state = Object.assign({}, this._state, {responseId, searchBoxTitle});
    this.state.next(this._state);
  }

  get responseFilter() {
    return this._state.responseId ? this._state.responseId : null;
  }

  set situations(situations: string[][] | null) {
    this._state = Object.assign({}, this._state, {situations});
    this.state.next(this._state);
  }

  selectService(service: Card | null, preview: boolean = false, replaceCenterZoom: [number, number, number] | null = null) {
    console.log('SELECT SERVICE', service?.card_id, 'Current:', this._state.cardId);
    this.cardId = service?.card_id || null;
    if (service && !this.savedGeo && this._state.geo && this._state.geo.length === 3) {
      this.savedGeo = this._state.geo;
      // console.log('SAVED GEO', this.savedGeo);
    }
    if (!service) {
      if (replaceCenterZoom) {
        this.centerZoom = replaceCenterZoom;
      } else if (this.savedGeo) {
        this.centerZoom = this.savedGeo;
        // console.log('CLEARED GEO', this.savedGeo);
        this.savedGeo = null;  
      }
    }
    this.selectedService.next({service, preview});
  }

  applyFromUrl(urlToApply: string) {
    const url = new URL(urlToApply);
    const params = url.searchParams;
    if (params) {
      const encodedState = params.get('state');
      if (encodedState) {
        const decoded = this.decode(encodedState);
        this._state = decoded;
        this.state.next(this._state);
      }
    }
  }
}
