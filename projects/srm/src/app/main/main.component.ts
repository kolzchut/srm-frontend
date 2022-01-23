import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReplaySubject, timer } from 'rxjs';
import { delay, filter, switchMap, tap } from 'rxjs/operators';
import { Card, CategoryCountsResult, DrawerState, HeaderState, CardState, MultiState } from '../common/datatypes';
import { LayoutService } from '../layout.service';
import { MapComponent } from '../map/map.component';
import { PlatformService } from '../platform.service';
import { SearchService } from '../search.service';
import { SituationsService } from '../situations.service';
import { CenterZoomType, GeoType, StateService } from '../state.service';
import { WindowService } from '../window.service';

// import * as mapboxgl from 'mapbox-gl';
declare var mapboxgl: any;
@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.less']
})
export class MainComponent implements OnInit {

  @ViewChild('mapPopup') mapPopup: ElementRef;

  drawerState: DrawerState = DrawerState.Presets;
  headerState: HeaderState = HeaderState.Visible;
  _headerActive = false;
  cardState: CardState = CardState.None;
  multiState: MultiState = MultiState.None;
  selectedCard: Card | null = null;
  selectedMulti: Card[] | null = null;
  hoverCard: Card | null = null;
  hoverMulti: Card[] | null = null;

  savedView: {drawerState: DrawerState, geo: GeoType} | null = null;

  DrawerState = DrawerState;
  HeaderState = HeaderState;
  CardState = CardState;
  MultiState = MultiState;

  map: mapboxgl.Map;
  mapComponent: MapComponent;

  activePopup: mapboxgl.Popup | null = null;
  currentPopup: string | null = null;
  loaded = new ReplaySubject(1);

  counts: CategoryCountsResult[] = [];

  disclaimerVisible = false;
  miniDisclaimerHidden = false;
  DISMISSED_DISCLAIMER = 'dismissed-disclaimer';

  menu = false;
  infoPage: string | null = null;
  modifier: string | null = null;
  
  
  constructor(
        public state: StateService, public search: SearchService,
        private situations: SituationsService, public layout: LayoutService,
        private router: Router, private activatedRoute: ActivatedRoute,
        private window: WindowService, private platform: PlatformService,
  ) {
    this.state.trackRoute(this.router, this.activatedRoute);
    this.loaded.pipe(
    ).subscribe(() => {
      this.state.selectedCard.subscribe(({card}) => {
        this.selectCard(card);
      });
      this.state.selectedCards.subscribe(({cards}) => {
        this.selectMulti(cards);
      });
    });
    this.search.visibleCounts.subscribe((counts: CategoryCountsResult[]) => {
      this.counts = counts.map(c => {
        return {
          id: `human_services:${c.category}`,
          category: c.category,
          count: c.count,
          color: c.color,
        };
      });
      this.handleEvent(this.counts.length > 0 ? 'has-results' : 'no-results');
    });
    this.state.filterChanges.pipe(
      filter((state) => ((state.responseId && state.responseId.length > 0) || (!!state.situations && state.situations.length > 0))),
    ).subscribe(() => {
      this.handleEvent('show-results');
    });
    this.platform.browser(() => {
      this.disclaimerVisible = this.window._?.localStorage?.getItem(this.DISMISSED_DISCLAIMER) !== 'true';
      if (!this.disclaimerVisible) {
      }
    });
    this.platform.server(() => {
      this.loaded.next();
    });
  }

  ngOnInit(): void {
  }

  headerVisible(): boolean {
    return this.headerState === HeaderState.Visible && (
      this.headerActive || this.situations.activeEditors().length > 0
    );
  }

  mapSelectedPoints(cards: Card[]) {
    if (cards.length > 0) {
      this.modifier = 'preview';
      this.state.cards = cards;
    } else {
      this.handleEvent('map-click');
    }
  }

  mapHoverPoints(cards: Card[]) {
    this.hoverMulti = this.hoverCard = null;
    if (this.cardState === CardState.None && this.multiState === MultiState.None) {
      if (cards.length > 1) {
        this.hoverMulti = cards;
        this.popup(cards[0], true);
      } else if (cards.length === 1) {
        this.hoverCard = cards[0];
        this.popup(cards[0], false);
      } else {
        this.popup(null, false);
      }
    }
  }

  popup(card: Card | null, multistrip: boolean = false) {
    if (this.layout.desktop) {
      if (this.activePopup) {
        this.activePopup.remove();
        this.activePopup = null;
      }
      this.currentPopup = null;
      if (card) {
        timer(0).pipe(
          tap(() => this.currentPopup = card.point_id),
          delay(0),
        ).subscribe(() => {
          if (this.mapPopup && this.mapPopup.nativeElement) {
            const mapPopup = (this.mapPopup.nativeElement as HTMLElement).firstChild as HTMLElement;
            if (mapPopup !== null) {
              this.activePopup = new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false,
                anchor: 'bottom',
                className: multistrip ? 'map-popup-multistrip' : 'map-popup-single',
              })
              .setLngLat(card.branch_geometry)
              .setDOMContent(mapPopup)
              .setMaxWidth("300px")
              .addTo(this.map);
            }
          }
        });  
      }
    }
  }

  selectMulti(cards: Card[] | null) {
    console.log('MAIN SELECT MULTI',this.multiState, cards && cards.length ? cards[0].point_id : 'pointless');
    const hasCards = cards && cards.length > 0;
    if (hasCards) {
      this.hoverMulti = this.hoverCard = null;
      const card = (cards as Card[])[0];
      if (this.multiState === MultiState.None) {
        this.saveView();
        this.multiState = MultiState.Preview;        
        this.drawerState = DrawerState.Peek;
      }
      timer(0).subscribe(() => {
        this.mapComponent?.queueAction((map) => map.flyTo({center: card.branch_geometry, zoom: 15}, {internal: true, kind: 'select-item'}));
      });
      this.popup(card, true);
      this.search.closeFilter.next();
    } else {
      if (this.multiState !== MultiState.None) {
        this.popView();
        this.multiState = MultiState.None;
        this.popup(null);
      }
    }
    this.selectedMulti = cards;
    this.modifier = null;
    this.setLabelsFilter();
  }

  selectCard(card: Card | null) {
    console.log('MAIN SELECT CARD', this.cardState, card?.card_id, this.modifier);
    if (card) {
      this.hoverMulti = this.hoverCard = null;
      if (this.cardState === CardState.None) {
        this.saveView();
        if (this.modifier === 'preview') {
          this.cardState = CardState.Preview;
          this.drawerState = DrawerState.Peek;
        } else {
          this.cardState = CardState.Full;
          this.drawerState = DrawerState.Most;
          this.headerState = HeaderState.Hidden;  
        }
      } else {
        this.cardState = CardState.Full;
        this.drawerState = DrawerState.Most;
        this.headerState = HeaderState.Hidden;
      }
      timer(0).subscribe(() => {
        this.mapComponent?.queueAction((map) => map.flyTo({center: card.branch_geometry, zoom: 15}, {internal: true, kind: 'select-item'}));
      });
      if (this.multiState === MultiState.None) {
        this.popup(card);
      }
      this.search.closeFilter.next();
    } else {
      if (this.multiState === MultiState.None) {
        this.popView();
      }
      this.headerState = HeaderState.Visible;
      if (this.multiState === MultiState.None) {
        this.popup(null);
      }
      this.cardState = CardState.None;
    }
    this.selectedCard = card;
    this.modifier = null;
    this.setLabelsFilter();
  }

  setMap(map: MapComponent) {
    this.mapComponent = map;
    this.map = map.map;
    this.setLabelsFilter();
    console.log('LOADED');
    this.loaded.next();
  }

  setLabelsFilter() {
    const non_existent = 'nonexistent';
    let record_id = non_existent;
    if (this.selectedMulti) {
      record_id = this.selectedMulti[0].point_id
    } else if (this.selectedCard) {
      record_id = this.selectedCard.point_id
    }
    console.log('Filtering cards for', record_id);
    if (this.layout.desktop) {
      this.map?.setFilter('labels-active', ['==', ['get', 'point_id'], non_existent]);
    } else {
      this.map?.setFilter('labels-active', ['==', ['get', 'point_id'], record_id]);
    }
    this.map?.setFilter('labels-off', ['!=', ['get', 'point_id'], record_id]);
  }

  handleEvent(event: string) {
    console.log('EV', this.cardState, event, this.drawerState);
    if (this.cardState === CardState.Preview) {
      if (event === 'click' || event === 'up' || event === 'close-card' || event === 'map-click') {
        this.state.cards = null;
      }
    } else if (this.multiState === MultiState.Preview) {
      if (event === 'click' || event === 'up' || event === 'map-click') {
        this.state.cards = null;
      }
      if (event === 'close-card') {
        this.state.card = null;
      }
    } else if (this.cardState === CardState.Full) {
      if (event === 'click' || event === 'down') {
        if (this.drawerState === DrawerState.Most) {
          this.drawerState = DrawerState.Hidden;
        }
      }
      if (event === 'map-click' || event === 'close-card') {
        this.state.cards = null;
      }
    } else if (this.cardState === CardState.None) {
      if (event === 'click') {
        if (this.drawerState === DrawerState.Peek || this.drawerState === DrawerState.Most || this.drawerState === DrawerState.Full || this.drawerState === DrawerState.Presets) {
          this.drawerState = DrawerState.Card;
        } else if (this.drawerState === DrawerState.Card) {
          this.drawerState = DrawerState.Most;
        }
      } else if (event === 'up') {
        if (this.drawerState === DrawerState.Peek) {
          this.drawerState = DrawerState.Most;
        } else if (this.drawerState === DrawerState.Card || this.drawerState === DrawerState.Presets) {
          this.drawerState = DrawerState.Most;
        } else if (this.drawerState === DrawerState.Most) {
          this.drawerState = DrawerState.Full;
        }
      } else if (event === 'down' || event === 'map-click') {
        if (this.drawerState === DrawerState.Full) {
          this.drawerState = DrawerState.Card;
        } else if (this.drawerState === DrawerState.Most) {
          this.drawerState = DrawerState.Card;
        } else if (this.drawerState === DrawerState.Card || this.drawerState === DrawerState.Presets) {
          this.drawerState = DrawerState.Peek;
        }
      } else if (event === 'no-results') {
        this.drawerState = DrawerState.Hidden;
      } else if (event === 'has-results') {
        if (this.drawerState === DrawerState.Hidden) {
          this.drawerState = DrawerState.Card;
        }
      } else if (event === 'show-results') {
        this.drawerState = DrawerState.Most;
      }
    }
    if (!this.disclaimerVisible && event === 'map-click' || event === 'click') {
      this.miniDisclaimerHidden = true;
    }
    if (event === 'map-click') {
      this.closeDisclaimer();
    }
  }

  saveView() {
    if (!this.savedView) {
      this.savedView = {
        drawerState: this.drawerState,
        geo: this.state._state.geo || null
      }
    }
  }

  popView() {
    if (this.savedView) {
      this.drawerState = this.savedView.drawerState;
      const geo = this.savedView.geo;
      if (geo && geo.length === 3) {
        const center: mapboxgl.LngLatLike = [geo[0], geo[1]];
        const zoom = geo[2];
        timer(0).subscribe(() => {
          this.mapComponent?.queueAction((map) => map.flyTo({center, zoom}, {internal: true, kind: 'select-item'}));
        });
      }
      this.savedView = null;
    }
  }

  updateDrawerHeight(height: number) {
    if (this.layout.mobile) {
      console.log('UPDATE DRAWER HEIGHT', height);
      this.mapComponent?.queueAction((map) => map.flyTo({
          center: this.map.getCenter(),
          zoom: this.map.getZoom(),
          padding: {top: 0, left: 0, bottom: height, right: 0}
        }, {internal: true, kind: 'update-drawer-height'}
      ));
    }
  }

  set headerActive(active: boolean) {
    this._headerActive = active;
    if (active) {
      this.handleEvent('map-click');
    }
  }

  get headerActive(): boolean {
    return this._headerActive;
  }

  closeDisclaimer(showAgain=true) {
    if (!showAgain) {
      window.localStorage.setItem(this.DISMISSED_DISCLAIMER, 'true');
    }
    this.disclaimerVisible = false;
  }

}
