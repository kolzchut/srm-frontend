import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReplaySubject, Subject, timer } from 'rxjs';
import { debounceTime, delay, distinctUntilChanged, filter, switchMap, tap } from 'rxjs/operators';
import { Card, CategoryCountsResult, DrawerState, HeaderState, CardState, MultiState } from '../common/datatypes';
import { DrawerComponent } from '../drawer/drawer.component';
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
  styleUrls: ['./main.component.less'],
  host: {
    '[class.away]': '!!infoPage'
  }
})
export class MainComponent implements OnInit {

  @ViewChild('mapPopup') mapPopup: ElementRef;
  @ViewChild('drawer') drawerComponent: DrawerComponent;

  DrawerState = DrawerState;
  HeaderState = HeaderState;
  CardState = CardState;
  MultiState = MultiState;

  drawerState: DrawerState = DrawerState.Presets;
  headerState: HeaderState = HeaderState.Visible;
  cardState: CardState = CardState.None;
  multiState: MultiState = MultiState.None;

  loaded = new ReplaySubject(1);

  selectedCard: Card | null = null;
  selectedMulti: Card[] | null = null;

  hoverCard: Card | null = null;
  hoverMulti: Card[] | null = null;

  _headerActive = false;
  drawerScrolled = false;

  savedView: {drawerState: DrawerState, geo: GeoType} | null = null; //TODO: Remove

  map: mapboxgl.Map;
  mapComponent: MapComponent;

  activePopup: mapboxgl.Popup | null = null;
  currentPopup: string | null = null;
  mapHoverPointsStream = new Subject<Card[]>();

  counts: CategoryCountsResult[] = [];
  collapseCounts = 1000;

  disclaimerVisible = false;
  miniDisclaimerHidden = false;
  DISMISSED_DISCLAIMER = 'dismissed-disclaimer';

  menu = false;
  infoPage: string | null = null;
  waitPreview: string | null = null;
  
  constructor(
        public state: StateService, public search: SearchService,
        private situations: SituationsService, public layout: LayoutService,
        private router: Router, private activatedRoute: ActivatedRoute,
        private window: WindowService, private platform: PlatformService,
  ) {
    // After loading, start tracking URL, selected card/cards/hovers
    this.loaded.subscribe(() => {
      this.state.selectedCards.subscribe(({cards}) => {
        if (cards) {
          if (cards.length > 1) {
            this.selectMulti(cards);
          } else {
            this.selectCard(cards[0]);
          }
        } else {
          this.selectMulti(cards);
        }
      });
      this.state.selectedCard.subscribe(({card}) => {
        this.selectCard(card);
      });
      this.mapHoverPointsStream.pipe(
        debounceTime(250),
        distinctUntilChanged((x, y) => !!x && !!y && x.length === y.length && x.length > 0 && x[0].point_id === y[0].point_id),
      ).subscribe(cards => {
        this.clearHovers();
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
      });
      this.state.trackRoute(this.router, this.activatedRoute);
    });

    // Track visible counts and generate has-results and no-results events
    this.search.visibleCounts.subscribe((counts: CategoryCountsResult[]) => {
      this.counts = counts.slice();
      this.collapseCounts = this.counts.length > 12 ? this.counts.length - 10 : 0;
      this.handleEvent(this.counts.length > 0 ? 'has-results' : 'no-results');
    });

    // Whenever the filter changes, generate the show-results event
    this.state.filterChanges.pipe(
      filter((state) => ((state.responseId && state.responseId.length > 0) || (!!state.situations && state.situations.length > 0))),
    ).subscribe(() => {
      this.handleEvent('show-results');
    });

    // Show disclaimer on browser
    this.platform.browser(() => {
      this.disclaimerVisible = this.window._?.localStorage?.getItem(this.DISMISSED_DISCLAIMER) !== 'true';
      if (!this.disclaimerVisible) {
      }
    });

    // Assume loaded on server
    this.platform.server(() => {
      this.loaded.next();
    });
  }

  ngOnInit(): void {
  }

  setMap(map: MapComponent) {
    this.mapComponent = map;
    this.map = map.map;
    this.setLabelsFilter();
    console.log('LOADED');
    this.loaded.next();
  }

  // Layout
  headerVisible(): boolean {
    return this.headerState === HeaderState.Visible && (
      this.headerActive || this.situations.activeEditors().length > 0
    );
  }

  popup(card: Card | null, multistrip: boolean = false) {
    if (this.layout.desktop && this.map?.getZoom() >= this.mapComponent.ZOOM_THRESHOLD) {
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
                // offset: [-2, -10],
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

  updateDrawerHeight(height: number) {
    if (this.layout.mobile) {
      console.log('UPDATE DRAWER HEIGHT', height);
      this.mapComponent?.queueAction((map) => map.flyTo({
          center: this.map.getCenter(),
          zoom: this.map.getZoom(),
          padding: {top: 0, left: 0, bottom: height, right: 0}
        }, {internal: true, kind: 'update-drawer-height'}
      ), 'update-drawer-height');
    }
  }

  resizeMap() {
    timer(400).subscribe(() => {this.map.resize();});
  }

  expandCounts() {
    return !this.drawerScrolled && this.drawerState !== DrawerState.Hidden && this.drawerState !== DrawerState.Peek;
  }

  // State
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

  clearCardSelections() {
    this.state.card = null;
    this.state.cards = null;
  }

  clearHovers() {
    this.hoverMulti = this.hoverCard = null;
  }

  // Event handling
  mapSelectedPoints(cards: Card[]) {
    if (cards.length > 0) {
      if (cards.length === 1) {
        this.waitPreview = cards[0].card_id;
      }
      this.state.cards = cards;
    } else {
      this.handleEvent('map-click');
    }
  }

  mapHoverPoints(cards: Card[]) {
    cards = [
      ...cards.filter(card => this.situations.shouldFilter(card.situation_ids)),
      ...cards.filter(card => !this.situations.shouldFilter(card.situation_ids)),
    ];
    this.mapHoverPointsStream.next(cards);
  }

  selectMulti(cards: Card[] | null) {
    console.log('MAIN SELECT MULTI',this.multiState, cards && cards.length ? cards[0].point_id : 'pointless');
    const hasCards = !!cards && cards.length > 0;
    if (hasCards) {
      const _cards = cards as Card[];
      cards = [
        ..._cards.filter(card => this.situations.shouldFilter(card.situation_ids)),
        ..._cards.filter(card => !this.situations.shouldFilter(card.situation_ids)),
      ];
      this.clearHovers();
      const card = (cards as Card[])[0];
      if (this.multiState === MultiState.None) {
        this.saveView();
        this.multiState = MultiState.Preview;        
        this.drawerState = DrawerState.Peek;
      }
      // TODO: Zoom in action when point is selected
      // timer(0).subscribe(() => {
      //   this.mapComponent?.queueAction(
      //     (map) => map.flyTo({center: card.branch_geometry, zoom: 15}, {internal: true, kind: 'select-item'}),
      //     'select-item-multi-' + card.branch_geometry
      //   );
      // });
      this.popup(card, true);
      this.search.closeFilter.next();
      this.selectedMulti = cards;
    } else {
      if (this.multiState !== MultiState.None) {
        this.popView();
        this.multiState = MultiState.None;
        this.popup(null);
      }
      this.selectedMulti = null;
    }
    this.setLabelsFilter();
  }

  selectCard(card: Card | null) {
    console.log('MAIN SELECT CARD', this.cardState, card?.card_id, this.waitPreview);
    if (card) {
      this.clearHovers();
      if (this.cardState === CardState.None) {
        this.saveView();
        if (this.waitPreview === card.card_id) {
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
      // TODO: Zoom in action when point is selected
      // timer(0).subscribe(() => {
      //   this.mapComponent?.queueAction(
      //     (map) => map.flyTo({center: card.branch_geometry, zoom: 15}, {internal: true, kind: 'select-item'}),
      //     'select-item-' + card.branch_geometry
      //   );
      // });
      if (this.multiState === MultiState.None) {
        this.popup(card);
      }
      this.drawerComponent?.scrollToTop();
      this.search.closeFilter.next();
      this.waitPreview = null;
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
    this.setLabelsFilter();
  }

  setLabelsFilter() { //TODO: Needs fixing, as it overrides the filter set in another location
    const non_existent = 'nonexistent';
    let record_id = non_existent;
    if (this.selectedMulti) {
      record_id = this.selectedMulti[0].point_id
    } else if (this.selectedCard) {
      record_id = this.selectedCard.point_id
    }
    if (this.layout.desktop) {
      this.map?.setFilter('labels-active', ['==', ['get', 'point_id'], non_existent]);
    } else {
      this.map?.setFilter('labels-active', ['==', ['get', 'point_id'], record_id]);
    }
    if (this.mapComponent) {
      this.mapComponent.labelsOffFilter = ['!=', ['get', 'point_id'], record_id];
    }
  }

  handleEvent(event: string) {
    console.log('EV', this.cardState, event, this.drawerState);
    if (this.cardState === CardState.Preview) {
      if (event === 'click' || event === 'up' || event === 'close-card' || event === 'map-click') {
        this.clearCardSelections();
        this.cardState = CardState.None;
      }
    } else if (this.multiState === MultiState.Preview) {
      if (event === 'click' || event === 'up' || event === 'map-click') {
        this.clearCardSelections();
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
        this.clearCardSelections();
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

  // View save / restore
  saveView() {
    if (!this.savedView) {
      this.savedView = {
        drawerState: this.drawerState,
        geo: null, //this.state._state.geo || null
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
          this.mapComponent?.queueAction(
            (map) => map.flyTo({center, zoom}, {internal: true, kind: 'select-item'}),
            'pop-view-' + geo
          );
        });
      }
      this.savedView = null;
    }
  }

}
