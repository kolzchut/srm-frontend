import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as mapboxgl from 'mapbox-gl';
import { ReplaySubject, timer } from 'rxjs';
import { delay, filter, switchMap, tap } from 'rxjs/operators';
import { Card, CategoryCountsResult, DrawerState, HeaderState, ItemState } from '../common/datatypes';
import { LayoutService } from '../layout.service';
import { MapComponent } from '../map/map.component';
import { PlatformService } from '../platform.service';
import { SearchService } from '../search.service';
import { SituationsService } from '../situations.service';
import { StateService } from '../state.service';
import { WindowService } from '../window.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.less']
})
export class MainComponent implements OnInit {

  @ViewChild('mapPopup') mapPopup: ElementRef;

  drawerState: DrawerState = DrawerState.Presets;
  savedDrawerState: DrawerState | null = null;
  headerState: HeaderState = HeaderState.Visible;
  _headerActive = false;
  itemState: ItemState = ItemState.None;
  selectedItem: Card | null = null;
  selectedItems: Card[] | null = null;
  savedSelectedItems: Card[] | null = null;

  DrawerState = DrawerState;
  ItemState = ItemState;
  HeaderState = HeaderState;

  map: mapboxgl.Map;
  mapComponent: MapComponent;

  activePopup: mapboxgl.Popup | null = null;
  hasPopup = false;
  loaded = new ReplaySubject(1);

  counts: CategoryCountsResult[] = [];

  disclaimerVisible = false;
  miniDisclaimerHidden = false;
  DISMISSED_DISCLAIMER = 'dismissed-disclaimer';

  menu = false;
  infoPage: string | null = null;
  
  
  constructor(
        public state: StateService, public search: SearchService,
        private situations: SituationsService, public layout: LayoutService,
        private router: Router, private activatedRoute: ActivatedRoute,
        private window: WindowService, private platform: PlatformService,
  ) {
    this.state.trackRoute(this.router, this.activatedRoute);
    this.loaded.pipe(
      switchMap(() => this.state.selectedCard)
    ).subscribe(({card, preview}) => {
      this.selectItem(card, preview);
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
    if (cards.length === 1) {
      this.selectedItems = null;
      this.state.selectCardPreview(cards[0]);
    } else if (cards.length > 1) {
      this.selectItems(cards);
      this.setLabelsFilter();
    } else {
      this.handleEvent('map-click');
    }
  }

  popup(card: Card | null, multistrip: boolean = false) {
    if (this.layout.desktop) {
      if (this.activePopup) {
        this.activePopup.remove();
        this.activePopup = null;
      }
      this.hasPopup = false;
      if (card) {
        timer(0).pipe(
          tap(() => this.hasPopup = true),
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

  selectItems(items: Card[]) {
    this.state.deselectCardWithCenterZoom([...items[0].branch_geometry, 15]);
    this.selectedItems = items;
    this.itemState = ItemState.MultiStrip;
    this.drawerState = DrawerState.Peek;
    if (items) {
      this.popup(items[0], true);
      this.search.closeFilter.next();
    }
  }

  selectItem(item: Card | null, preview: boolean = false) {
    console.log('SELECT ITEM',this.itemState, preview, item?.card_id);
    if (item !== null && this.selectedItem !== null && item !== this.selectedItem) {
      return;
    }
    if (item) {
      if (this.itemState === ItemState.None) {
        this.savedDrawerState = this.drawerState;
        if (preview) {
          this.itemState = ItemState.Preview;
          this.drawerState = DrawerState.Peek;
        } else {
          this.itemState = ItemState.Full;
          this.drawerState = DrawerState.Most;
          this.headerState = HeaderState.Hidden;  
        }
      } else if (this.itemState === ItemState.MultiStrip) {
        this.itemState = ItemState.Full;
        this.drawerState = DrawerState.Most;
        this.headerState = HeaderState.Hidden;
        this.savedSelectedItems = this.selectedItems;
        this.selectedItems = null;
      } else {
        this.itemState = ItemState.Full;
        this.drawerState = DrawerState.Most;
        this.headerState = HeaderState.Hidden;
      }
      this.mapComponent?.queueAction((map) => map.flyTo({center: item.branch_geometry, zoom: 15}, {internal: true, kind: 'select-item'}));
      if (!this.savedSelectedItems) {
        this.popup(item);
      }
      console.log('CLOSEFILTER');
      this.search.closeFilter.next();
    } else {
      if (this.savedDrawerState) {
        this.drawerState = this.savedDrawerState;
      }
      this.selectedItems = this.savedSelectedItems;
      this.savedDrawerState = null;
      this.savedSelectedItems = null;
      this.headerState = HeaderState.Visible;
      if (this.selectedItems) {
        this.itemState = ItemState.MultiStrip;
        this.drawerState = DrawerState.Peek;
      } else {
        this.popup(null);
        this.itemState = ItemState.None;
      }
    }
    this.selectedItem = item;
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
    if (this.selectedItems) {
      record_id = this.selectedItems[0].point_id
    } else if (this.selectedItem) {
      record_id = this.selectedItem.point_id
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
    console.log('EV', this.itemState, event, this.drawerState);
    if (this.itemState === ItemState.Preview) {
      if (event === 'click' || event === 'up' || event === 'close' || event === 'map-click') {
        this.state.card = null;
      }
    } else if (this.itemState === ItemState.MultiStrip) {
      if (event === 'click' || event === 'up' || event === 'map-click') {
        this.state.card = null;
      }
    } else if (this.itemState === ItemState.Full) {
      if (event === 'click' || event === 'down') {
        if (this.drawerState === DrawerState.Most) {
          this.drawerState = DrawerState.Hidden;
        }
      }
      if (event === 'close' || event === 'map-click') {
        this.state.card = null;
      }
    } else if (this.itemState === ItemState.None) {
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
        this.savedDrawerState = this.drawerState;
        this.drawerState = DrawerState.Hidden;
      } else if (event === 'has-results') {
        if (this.drawerState === DrawerState.Hidden && this.savedDrawerState) {
          this.drawerState = this.savedDrawerState;
          this.savedDrawerState = null;
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

  updateDrawerHeight(height: number) {
    if (this.layout.mobile && this.itemState !== ItemState.None) {
      this.mapComponent?.queueAction((map) => map.flyTo({
          center: this.map.getCenter(),
          zoom: this.map.getZoom(),
          padding: {top: 0, left: 0, bottom: height, right: 0}
        }, {internal: true, kind: 'update-drawer-height'}
      ));
    } else {
      this.mapComponent?.queueAction((map) => map.flyTo({
          center: this.map.getCenter(),
          zoom: this.map.getZoom(),
          padding: {top: 0, left: 0, bottom: 0, right: 0}
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
