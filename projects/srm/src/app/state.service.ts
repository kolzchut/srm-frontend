import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LngLat, LngLatBounds, LngLatLike } from 'mapbox-gl';
import { BehaviorSubject, from, Observable, ReplaySubject, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, first, map, switchMap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Card } from './common/datatypes';

export type State = {
  geo?: [number, number, number] | [[number, number], [number, number]] | null;
  searchBoxTitle?: string,
  cardId?: string | null,
  skipGeoUpdate?: boolean,
  responseId?: string | null,
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
  selectedService = new ReplaySubject<{service: Card | null, preview: boolean}>(1);
  savedGeo: [number, number, number] | null;
  latestBounds: LngLatBounds;

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private api: ApiService) {
    // State encoding into URL
    this.state.subscribe(state => {
      this.currentState = this.encode(state);
      const queryParams = {
        state: this.currentState
      };
      console.log('E:STATE', state, '->', queryParams.state);
      this.router.navigate(['/'], {replaceUrl: true, queryParams});
    });
    // State decoding from URL
    this.activatedRoute.queryParams.pipe(
      map(params => params.state),
      filter((state) => state && state !== this.currentState)
    ).subscribe((state) => {
      this.currentState = state;
      try {
        const parsed = this.decode(state);
        console.log('D:STATE', state, '->', parsed);
        this._state = Object.assign({}, this._state, parsed);
        this.state.next(this._state);
      } catch (e) {
      }
    });
    // State stream - only for geo view changes
    this.geoChanges = this.state.pipe(
      filter((state) => !state.skipGeoUpdate),
      distinctUntilChanged<State>(keyComparer(['geo'])),
      debounceTime(1000),
      map((state) => {
        return {geo: state.geo};
      }),
    );
    this.filterChanges = this.state.pipe(
      distinctUntilChanged<State>(keyComparer(['responseId'])),
      map((state) => {
        return {responseId: state.responseId};
      }),
    );
    // State stream - for first time item fetching
    this.state.pipe(
      first(),
      filter((state) => !!state.cardId),
      switchMap((state) => this.api.getItem(state.cardId as string))
    ).subscribe((service: Card) => {
      console.log('FIRST TIME - Fetched', service);
      this.selectService(service);
    });
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

  set searchBoxTitle(searchBoxTitle: string) {
    this._state = Object.assign({}, this._state, {searchBoxTitle});
    this.state.next(this._state);
  }

  set cardId(cardId: string | null) {
    this._state = Object.assign({}, this._state, {cardId});
    this.state.next(this._state);
  }

  set responseFilter(responseId: string | null) {
    this._state = Object.assign({}, this._state, {responseId});
    this.state.next(this._state);
  }

  get responseFilter() {
    return this._state.responseId ? this._state.responseId : null;
  }

  set situations(situations: string[][] | null) {
    this._state = Object.assign({}, this._state, {situations});
    this.state.next(this._state);
  }

  selectService(service: Card | null, preview: boolean = false) {
    console.log('SELECT SERVICE', service?.card_id, 'Current:', this._state.cardId);
    this.cardId = service?.card_id || null;
    this.searchBoxTitle = service?.service_name || '';
    if (service && !this.savedGeo && this._state.geo && this._state.geo.length === 3) {
      this.savedGeo = this._state.geo;
      console.log('SAVED GEO', this.savedGeo);
    }
    if (!service && this.savedGeo) {
      this.centerZoom = this.savedGeo;
      console.log('CLEARED GEO', this.savedGeo);
      this.savedGeo = null;
    }
    this.selectedService.next({service, preview});
  }

  
}
