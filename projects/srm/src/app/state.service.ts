import { Injectable } from '@angular/core';
import { ActivatedRoute, NavigationStart, Router, Event } from '@angular/router';
import { LngLatBounds } from 'mapbox-gl';
import { BehaviorSubject, from, merge, Observable, ReplaySubject, Subject } from 'rxjs';
import { filter, map, switchMap, delay, pairwise, tap, debounceTime } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Card } from './common/datatypes';
import { ResponsesService } from './responses.service';
import { Location } from '@angular/common';
import { SeoSocialShareService } from 'ngx-seo';
import { StateEncoderDecoder } from './url-encode-decode';

export type CenterZoomType = [number, number, number];
export type GeoType = CenterZoomType | [[number, number], [number, number]] | null;

export type State = {
  geo?: GeoType;                      // Where the map is centered and zoomed
  searchBoxTitle?: string,            // Title of the search box
  cardId?: string | null,             // Id of the card that is currently selected
  pointId?: string | null,            // Id of the map point that is currently selected
  placeId?: string | null,            // Id of the place that is currently selected
  responseId?: string | null,         // Id of the response that is currently selected
  skipGeoUpdate?: boolean,            // Whether to skip the geo update when this state is generated (e.g. when the map is moved)
  situations?: string[][] | null,     // List of situations that are currently filtered on
  diff?: string[] | null,             // List of diffs between current and previous state
};

function compareStates(a: State, b: State) {
  const states = [a, b];
  const diffs = [];
  for (const key of ['geo', 'searchBoxTitle', 'cardId', 'pointId', 'placeId', 'responseId', 'situations']) {
    const values = [];
    for (const state of states) {
      values.push(JSON.stringify(state.hasOwnProperty(key)? (state as any)[key] : null))
    }
    if (values[0] !== values[1]) {
      diffs.push(key);
    }
  }
  return diffs;
}

function filterDiffs(keys: string[]) {
  return (state: State) => {
    const ret = keys.some((key) => state.diff && state.diff.indexOf(key) >= 0);
    console.log('FD', keys, state.diff, ret);
    return ret;
  };
}

@Injectable({
  providedIn: 'root'
})
export class StateService {
  _state: State = {};
  incomingStateSubject = new Subject<State>();
  stateSubject = new BehaviorSubject<State>({});
  state = new Subject<State>();
  // currentState: string = '_';
  urlEncoderDecoder = new StateEncoderDecoder();

  router: Router;

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
    // State stream, collect what changed and add it to the state object
    this.stateSubject.pipe(
      pairwise(),
      map(([prev, curr]) => {
        curr.diff = compareStates(prev, curr);
        if (curr.diff.length > 0) {
          console.log('CHANGED IN STATE', curr.diff, curr);
          if (curr.diff.indexOf('cardId') >= 0) { //TODO: remove
            console.log('CARD CHANGED', prev.cardId, curr.cardId);
          }
        }
        return curr;
      }),
      filter((state) => state.diff? state.diff.length > 0 : false),
    ).subscribe((state) => {
      this._state = state;
      console.log('NNN', state.diff);
      this.state.next(state);
    });

    // Streams for specific state changes
    this.geoChanges = this.state.pipe(
      filter(filterDiffs(['geo'])),
    );
    this.filterChanges = this.state.pipe(
      filter(filterDiffs(['responseId', 'situations'])),
    );
    this.responseChanges = this.state.pipe(
      filter(filterDiffs(['responseId'])),
    );
    this.situationChanges = this.state.pipe(
      filter(filterDiffs(['situations'])),
    );
    this.queryChanges = this.state.pipe(
      filter(filterDiffs(['searchBoxTitle'])),
    );
    this.cardChanges = this.state.pipe(
      filter(filterDiffs(['cardId'])), // TODO, 'card-id')),
    );
    this.pointIdChanges = this.state.pipe(
      filter(filterDiffs(['pointId'])), // TODO , 'point-id')),
    );
    
    // Select card / cards when the cardId/pointId changes
    this.cardChanges.subscribe((state) => {
      console.log('STATE CARD CHANGED', state.cardId, state.pointId);
      this.selectCardById(state.cardId || null);
    });
    this.pointIdChanges.subscribe((state) => {
      console.log('STATE POINT ID CHANGED', state.cardId, state.pointId);
      this.selectCardsByPointId(state.pointId || null);
    });
  }

  trackRoute(router: Router, activatedRoute: ActivatedRoute) {
    this.router = router;

    // Handle 'back' events
    router.events.pipe( //TODO: Check if still relevant
      filter((event: Event) =>(event instanceof NavigationStart)),
    ).subscribe((event) => {
      const ns = (event as NavigationStart);
      if (ns.navigationTrigger === 'popstate') {
        this._state.skipGeoUpdate = false;
      }
    });

    // State decoding from URL
    merge(
      activatedRoute.queryParams,
      activatedRoute.url
    ).pipe(
      map(() => activatedRoute.snapshot),
      tap((sn) => { console.log('CHANGED ROUTE', sn.queryParams.v); }),
      switchMap((sn) => {
        const responseId = sn.params.response || null;
        const placeId = sn.params.place || null;
        const cardId = sn.params.card || null;
        const state = sn.queryParams.v || '';
        return this.processPaths(responseId, placeId, cardId, state);
      }),
      // filter((state) => {
      //   return state !== this.currentState;          
      // }),
      map((state) => {
        // this.currentState = state;
        const decoded = this.urlEncoderDecoder.decode(state);
        // console.log('D:STATE', state, '->', decoded);
        return decoded
      })
    ).subscribe((state: State) => {
      this.stateSubject.next(state);
    });

    // State encoding to URL
    const incomingUpdates: any[] = [];
    this.incomingStateSubject.pipe(
      tap((update) => {
        incomingUpdates.push(update);
      }),
      debounceTime(100),
    ).subscribe(() => {
      const update = Object.assign({}, this._state);
      while (incomingUpdates.length > 0) {
        Object.assign(update, incomingUpdates.shift());
      }
      // update['__kind'] = kind;
      this.newState(update);
    });
  }

  newState(state: State) {
    if (this.router) {
      const encoded = this.urlEncoderDecoder.encode(state);
      // this.currentState = encoded;
      const queryParams = {
        v: encoded
      };
      this.router.navigate(['/'], {queryParams, replaceUrl: false});  
    } else {
      console.log('NO ROUTER');
    }
  }

  processPaths(responseId: string, placeId: string, cardId: string, encoded: string): Observable<string> {
    if (!!responseId || !!placeId || !!cardId) {
      const decoded = this.urlEncoderDecoder.decode(encoded);
      let obs: Observable<State> = from([]);
      if (!!responseId) {
        obs = this.api.getResponse(responseId).pipe(
          map((response) => {
            decoded.responseId = responseId;
            decoded.searchBoxTitle = response.name;
            decoded.cardId = null;
            decoded.placeId = null;
            this.seo.setTitle(`כל שירות - חיפוש ${response.name}`);
            this.seo.setDescription(`כל שירות - חיפוש שירותים מסוג ${response.name} המסופקים על ידי הממשלה, עמותות וחברות`);
            this.seo.setUrl(`https://www.kolsherut.org.il/r/${responseId}`);
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
            const name = place.name[0];
            this.seo.setTitle(`כל שירות - שירותים חברתיים ב${name}`);
            this.seo.setDescription(`כל שירות - חיפוש שירותים באזור ${name} המסופקים על ידי הממשלה, עמותות וחברות`);
            this.seo.setUrl(`https://www.kolsherut.org.il/p/${name}`);  
            this.placeName = name;
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
          return this.urlEncoderDecoder.encode(state);
        })
      );
    } else {
      return from([encoded]);
    }
  }
  
  // Change current state by one or more fields
  updateState(update: any, kind: string='') {
    console.log('UPDATE STATE WITH', update);
    this.incomingStateSubject.next(update);
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

  set responseFilter(responseId: string | null) {
    const searchBoxTitle = responseId ? this.responses.getResponseName(responseId) : '';
    this.updateState({responseId, searchBoxTitle});
  }

  get responseFilter() {
    return this._state.responseId ? this._state.responseId : null;
  }

  set situations(situations: string[][] | null) {
    this.updateState({situations});
  }

  set placeName(place: string) {
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
      const encodedState = params.get('v');
      if (encodedState) {
        const decoded: State = this.urlEncoderDecoder.decode(encodedState);
        this.updateState(this._state);
      }
    }
  }
}
