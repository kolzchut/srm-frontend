import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { ReplaySubject, timer } from 'rxjs';
import { delay, switchMap, tap } from 'rxjs/operators';
import { Card, CategoryCountsResult, DrawerState, HeaderState, ItemState } from '../common/datatypes';
import { LayoutService } from '../layout.service';
import { SearchService } from '../search.service';
import { SituationsService } from '../situations.service';
import { StateService } from '../state.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.less']
})
export class MainComponent implements OnInit {

  @ViewChild('mapPopup') mapPopup: ElementRef;

  drawerState: DrawerState = DrawerState.Peek;
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
  activePopup: mapboxgl.Popup | null = null;
  hasPopup = false;
  loaded = new ReplaySubject(1);

  counts: CategoryCountsResult[] = [];

  constructor(public state: StateService, private search: SearchService, private situations: SituationsService, public layout: LayoutService) {
    this.loaded.pipe(
      switchMap(() => this.state.selectedService)
    ).subscribe(({service, preview}) => {
      this.selectItem(service, preview);
    });
    search.visibleCounts.subscribe((counts: CategoryCountsResult[]) => {
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
      this.state.selectService(cards[0], true);
    } else if (cards.length > 1) {
      this.selectItems(cards);
      this.setLabelsFilter();
    } else {
      this.handleEvent('map-click');
    }
  }

  popup(card: Card | null, multistrip: boolean = false) {
    if (this.layout.desktop) {
      console.log('popup');
      if (this.activePopup) {
        console.log('remove active popup');
        this.activePopup.remove();
        this.activePopup = null;
      }
      this.hasPopup = false;
      if (card) {
        timer(0).pipe(
          tap(() => this.hasPopup = true),
          delay(0),
        ).subscribe(() => {
          const mapPopup = (this.mapPopup.nativeElement as HTMLElement).firstChild as HTMLElement;          
          console.log('new popup', mapPopup);
          if (mapPopup !== null) {
            console.log('add popup', mapPopup);
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
        });  
      }
    }
  }

  selectItems(items: Card[]) {
    this.selectItem(null);
    this.selectedItems = items;
    this.itemState = ItemState.MultiStrip;
    this.drawerState = DrawerState.Peek;
    if (items) {
      this.popup(items[0], true);
    }
  }

  selectItem(item: Card | null, preview: boolean = false) {
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
      this.map.flyTo({center: item.branch_geometry, zoom: 15}, {internal: true});
      if (!this.savedSelectedItems) {
        this.popup(item);
      }
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

  setMap(map: mapboxgl.Map) {
    this.map = map;
    this.loaded.next();
    this.setLabelsFilter();
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
      this.map.setFilter('labels-active', ['==', ['get', 'point_id'], non_existent]);
    } else {
      this.map.setFilter('labels-active', ['==', ['get', 'point_id'], record_id]);
    }
    this.map.setFilter('labels-off', ['!=', ['get', 'point_id'], record_id]);
  }

  handleEvent(event: string) {
    console.log('EV', this.itemState, event, this.drawerState);
    if (this.itemState === ItemState.Preview) {
      if (event === 'click' || event === 'up' || event === 'close' || event === 'map-click') {
        this.state.selectService(null);
      }
    } else if (this.itemState === ItemState.MultiStrip) {
      if (event === 'click' || event === 'up' || event === 'map-click') {
        this.selectItem(null);
      }
    } else if (this.itemState === ItemState.Full) {
      if (event === 'click' || event === 'down') {
        if (this.drawerState === DrawerState.Most) {
          this.drawerState = DrawerState.Hidden;
        }
      }
      if (event === 'close' || event === 'map-click') {
        this.state.selectService(null);
      }
    } else if (this.itemState === ItemState.None) {
      if (event === 'click') {
        if (this.drawerState === DrawerState.Peek || this.drawerState === DrawerState.Most || this.drawerState === DrawerState.Full) {
          this.drawerState = DrawerState.Card;
        } else if (this.drawerState === DrawerState.Card) {
          this.drawerState = DrawerState.Most;
        }
      } else if (event === 'up') {
        if (this.drawerState === DrawerState.Peek) {
          this.drawerState = DrawerState.Most;
        } else if (this.drawerState === DrawerState.Card) {
          this.drawerState = DrawerState.Most;
        } else if (this.drawerState === DrawerState.Most) {
          this.drawerState = DrawerState.Full;
        }
      } else if (event === 'down' || event === 'map-click') {
        if (this.drawerState === DrawerState.Full) {
          this.drawerState = DrawerState.Card;
        } else if (this.drawerState === DrawerState.Most) {
          this.drawerState = DrawerState.Card;
        } else if (this.drawerState === DrawerState.Card) {
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
      }
    }
  }

  updateDrawerHeight(height: number) {
    if (this.layout.mobile && this.itemState !== ItemState.None) {
      this.map?.flyTo({
        center: this.map.getCenter(),
        zoom: this.map.getZoom(),
        padding: {top: 0, left: 0, bottom: height, right: 0}
      });
    } else {
      this.map?.flyTo({
        center: this.map.getCenter(),
        zoom: this.map.getZoom(),
        padding: {top: 0, left: 0, bottom: 0, right: 0}
      });      
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
}
