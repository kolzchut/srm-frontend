import { Component, OnInit } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { ReplaySubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Card, CategoryCountsResult, DrawerState, HeaderState, ItemState } from '../common/datatypes';
import { SearchService } from '../search.service';
import { StateService } from '../state.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.less']
})
export class MainComponent implements OnInit {

  drawerState: DrawerState = DrawerState.Peek;
  savedDrawerState: DrawerState | null = null;
  headerState: HeaderState = HeaderState.Visible;
  headerActive = false;
  itemState: ItemState = ItemState.None;
  selectedItem: Card | null = null;
  selectedItems: Card[] | null = null;
  savedSelectedItems: Card[] | null = null;

  DrawerState = DrawerState;
  ItemState = ItemState;
  HeaderState = HeaderState;

  map: mapboxgl.Map;
  loaded = new ReplaySubject(1);

  counts: CategoryCountsResult[] = [];

  constructor(public state: StateService, private search: SearchService) {
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
    });  
  }

  ngOnInit(): void {
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

  selectItems(items: Card[]) {
    this.selectItem(null);
    this.selectedItems = items;
    this.itemState = ItemState.MultiStrip;
    this.drawerState = DrawerState.Peek;
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
      this.state.centerZoom = [...item.branch_geometry, 15];
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
        this.itemState = ItemState.None;
      }
    }
    this.selectedItem = item;
    this.setLabelsFilter();
  }

  setLabelsFilter() {
    let record_id = 'nonexistent';
    if (this.selectedItems) {
      record_id = this.selectedItems[0].card_id
    } else if (this.selectedItem) {
      record_id = this.selectedItem.card_id
    }
    this.map.setFilter('labels-active', ['==', ['get', 'point_id'], record_id]);
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
      }
    }
  }

  updateDrawerHeight(height: number) {    
    this.map.flyTo({
      center: this.map.getCenter(),
      zoom: this.map.getZoom(),
      padding: {top: 0, left: 0, bottom: height, right: 0}
    });
  }
}
