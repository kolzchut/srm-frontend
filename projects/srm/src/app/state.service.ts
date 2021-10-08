import { Injectable } from '@angular/core';
import { LngLatBounds } from 'mapbox-gl';
import { ReplaySubject } from 'rxjs';

export type State = {
  bounds?: LngLatBounds,
  searchQuery?: string,
};

@Injectable({
  providedIn: 'root'
})
export class StateService {

  _state: State = {};
  state = new ReplaySubject<State>(1);

  constructor() { }

  set bounds(bounds: LngLatBounds) {
    this._state.bounds = bounds;
    console.log('NEW BOUNDS');
    this.state.next(this._state);
  }

  set searchQuery(searchQuery: string) {
    this._state.searchQuery = searchQuery;
    this.state.next(this._state);
  }

}
