import { Injectable } from '@angular/core';
import { ActivatedRoute, NavigationStart, Router, Event } from '@angular/router';
import { LngLat, LngLatBounds, LngLatLike } from 'mapbox-gl';
import { BehaviorSubject, from, merge, Observable, ReplaySubject, Subject, timer } from 'rxjs';
import { throttleTime, distinctUntilChanged, filter, first, map, switchMap, tap, delay } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Card, Response } from './common/datatypes';
import { ResponsesService } from './responses.service';
import { Location } from '@angular/common';
import { SeoSocialShareService } from 'ngx-seo';

export type CenterZoomType = [number, number, number];
export type GeoType = CenterZoomType | [[number, number], [number, number]] | null;

export type State = {
  geo?: GeoType;
  searchBoxTitle?: string,
  cardId?: string | null,
  pointId?: string | null,
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

function keyComparer(keys: string[], kind?: string) {
  return (x: any, y: any) => makeKey(x, keys) === makeKey(y, keys) && y.__kind !== kind;
}

@Injectable({
  providedIn: 'root'
})
export class StateService {
  _state: State = {}; 
  state = new ReplaySubject<State>(1);
  currentState: string = '_';

  geoChanges: Observable<State>;
  responseChanges: Observable<State>;
  situationChanges: Observable<State>;
  filterChanges: Observable<State>;
  queryChanges: Observable<State>;
  cardChanges: Observable<State>;
  pointIdChanges: Observable<State>;

  placeNames = new Subject<string>();

  selectedCard = new ReplaySubject<{card: Card | null}>(1);
  selectedCards = new ReplaySubject<{cards: Card[] | null}>(1);
  
  cardCache: {[key: string]: Card} = {};
  cardsCache: {[key: string]: Card[]} = {};

  savedGeo: CenterZoomType | null;
  latestBounds: LngLatBounds;
  replaceCenterZoom: CenterZoomType | null = null;

  constructor(private api: ApiService, private responses: ResponsesService, private location: Location, private seo: SeoSocialShareService) {
    // State stream - only for geo view changes
    this.geoChanges = this.state.pipe(
      distinctUntilChanged<State>(keyComparer(['geo'])),
    );
    this.filterChanges = this.state.pipe(
      distinctUntilChanged<State>(keyComparer(['responseId', 'situations'])),
    );
    this.responseChanges = this.state.pipe(
      distinctUntilChanged<State>(keyComparer(['responseId'])),
    );
    this.situationChanges = this.state.pipe(
      distinctUntilChanged<State>(keyComparer(['situations'])),
    );
    this.queryChanges = this.state.pipe(
      distinctUntilChanged<State>(keyComparer(['searchBoxTitle'])),
    );
    this.cardChanges = this.state.pipe(
      distinctUntilChanged<State>(keyComparer(['cardId'], 'card-id')),
    );
    this.pointIdChanges = this.state.pipe(
      distinctUntilChanged<State>(keyComparer(['pointId'], 'point-id')),
    );
    this.cardChanges.subscribe((state) => {
      // console.log('STATE CARD CHANGED', state);
      this.selectCardById(state.cardId || null);
    });
    this.pointIdChanges.subscribe((state) => {
      // console.log('STATE POINT ID CHANGED', state);
      this.selectCardsByPointId(state.pointId || null);
    });
  }

  trackRoute(router: Router, activatedRoute: ActivatedRoute) {
    // State decoding from URL
    router.events.pipe(
      filter((event: Event) =>(event instanceof NavigationStart)),
    ).subscribe((event) => {
      const ns = (event as NavigationStart);
      if (ns.navigationTrigger === 'popstate') {
        this._state.skipGeoUpdate = false;
      }
    });
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
        // console.log('D:STATE', state, '->', decoded);
        return decoded
      })
    ).subscribe((state: State) => {
      this.updateState(state);
    });

    this.state.pipe(
      delay(0),
      map((state) => {
        const encoded = this.encode(state);
        this.currentState = encoded;
        // console.log('E:STATE', state, '->', encoded);  
        return encoded;
      }),
    ).subscribe(encoded => {
      const queryParams = {
        state: encoded
      };
      router.navigate(['/'], {queryParams, replaceUrl: false});
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
            this.placeName = placeId;
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
      state.pointId || null,
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
          pointId: prepared[5] || null,
        };
      } catch (e) {
        console.log('DECODE ERROR', e);
      }
    }
    return {};
  }

  updateState(update: any, kind: string='') {
    console.log('UPDATE STATE WITH', update);
    update['__kind'] = kind;
    this._state = Object.assign({}, this._state, update);
    this.state.next(this._state);
  }

  set bounds(bounds: LngLatBounds) {
    const geo = bounds.toArray();
    this.updateState({geo, skipGeoUpdate: false});
  }

  updateCenterZoom(geo: CenterZoomType, skipGeoUpdate=false) {
    geo = geo.map(x => Math.round(x * 10000) / 10000) as CenterZoomType;
    this.updateState({geo, skipGeoUpdate});
  }

  set centerZoom(centerZoom: CenterZoomType) {
    this.updateCenterZoom(centerZoom);
  }

  // set searchBoxTitle(searchBoxTitle: string) {
  //   this._state = Object.assign({}, this._state, {searchBoxTitle});
  //   this.state.next(this._state);
  // }

  set responseFilter(responseId: string | null) {
    const searchBoxTitle = responseId ? this.responses.getResponseName(responseId) : '';
    this.seo.setTitle(`כל שירות - חיפוש ${searchBoxTitle}`);
    this.seo.setDescription(`כל שירות - חיפוש שירותים מסוג ${searchBoxTitle} המסופקים על ידי הממשלה, עמותות וחברות`);
    this.seo.setUrl(`https://www.kolsherut.org.il/r/${responseId}`);
    this.updateState({responseId, searchBoxTitle});
  }

  get responseFilter() {
    return this._state.responseId ? this._state.responseId : null;
  }

  set situations(situations: string[][] | null) {
    this.updateState({situations});
  }

  set placeName(place: string) {
    this.seo.setTitle(`כל שירות - שירותים חברתיים ב${place}`);
    this.seo.setDescription(`כל שירות - חיפוש שירותים באזור ${place} המסופקים על ידי הממשלה, עמותות וחברות`);
    this.seo.setUrl(`https://www.kolsherut.org.il/p/${place}`);  
    this.placeNames.next(place);
  }

  set cardId(cardId: string | null) {
    // console.log('STATE CARD ID <-', cardId);
    this.updateState({cardId}, cardId ? 'card-id' : '');
  }

  set card(card: Card | null) {
    // console.log('STATE CARD <-', card);
    if (card) {
      this.cardCache[card.card_id] = card;
      this.cardId = card.card_id;  
    } else {
      this.cardId = null;
    }
  }

  set pointId(pointId: string | null) {
    // console.log('STATE POINT ID <-', pointId);
    this.updateState({pointId}, pointId ? 'point-id' : '');
  }

  set cards(cards: Card[] | null) {
    // console.log('STATE CARDS <-', cards?.length, cards);
    if (cards) {
      const pointId = cards[0].point_id;
      this.cardsCache[pointId] = cards;
      if (this._state.pointId !== pointId) {
        // console.log('CHANGED POINT ID, clearing card');
        this.card = null;
      }
      this.pointId = pointId;
    } else {
      this.card = null;
      this.pointId = null;
    }
  }

  selectCardsByPointId(pointId: string | null) {
    // console.log('SELECT CARDS BY POINT ID', pointId);
    if (pointId) {
      const cards = this.cardsCache[pointId];
      let source = from([cards]).pipe(
        delay(0)
      );
      if (!cards) {
        source = this.api.getGeoData(pointId).pipe(
          map((point) => point.records)
        );
      }
      source.subscribe((cards) => {
        if (cards.length > 1) {
          this.selectCards(cards);
        } else {
          this.card = cards[0];
        }
      });
    } else {
      this.selectCard(null);
      this.selectCards(null);
    }
  }

  selectCardById(cardId: string | null) {
    // console.log('SELECT CARD BY ID', cardId);
    if (cardId) {
      const card = this.cardCache[cardId];
      if (card) {
        this.selectCard(card);
      } else {
        this.api.getCard(cardId).subscribe((card) => {
          this.selectCard(card);
        });
      }
    } else {
      this.selectCard(null);
    }
  }
  
  selectCards(cards: Card[] | null) {
    // console.log('SELECT CARDS', cards);
    if (cards) {
      this.cardsCache[cards[0].point_id] = cards;
    }
    this.selectedCards.next({cards});
  }

  selectCard(card: Card | null, replaceCenterZoom: CenterZoomType | null = null) {
    const cardId = card?.card_id || null;
    // console.log('SELECT CARD', cardId, this.savedGeo);
    if (card) {
      this.cardCache[card.card_id] = card;
      this.seo.setTitle(`כל שירות - ${card.service_name}`);
      this.seo.setDescription(`${card.branch_name} - ${card.service_description}`);
      this.seo.setUrl(`https://www.kolsherut.org.il/c/${card.card_id}`);  
    }
    if (card && !this.savedGeo && this._state.geo && this._state.geo.length === 3) {
      this.savedGeo = this._state.geo;
      // console.log('SAVED GEO', this.savedGeo);
    }
    if (!card) {
      if (this.replaceCenterZoom) {
        this.centerZoom = (replaceCenterZoom as CenterZoomType);
        this.replaceCenterZoom = null;
      } else if (this.savedGeo) {
        this.centerZoom = this.savedGeo;
        // console.log('CLEARED GEO', this.savedGeo);
        this.savedGeo = null;  
      }
    }
    this.selectedCard.next({card});
  }

  applyFromUrl(urlToApply: string) {
    console.log('APPLY FROM URL', urlToApply);
    const url = new URL(urlToApply);
    const params = url.searchParams;
    if (params) {
      const encodedState = params.get('state');
      if (encodedState) {
        const decoded: State = this.decode(encodedState);
        this._state = decoded;
        this.state.next(this._state);
      }
    }
  }
}
