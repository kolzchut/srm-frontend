import { Component, OnInit } from '@angular/core';
import { Card, DrawerState, HeaderState, ItemState } from '../common/datatypes';

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

  constructor() { }

  ngOnInit(): void {
  }

  mapSelectedPoints(cards: Card[]) {
    if (cards.length === 1) {
      this.selectedItems = null;
      this.selectItem(cards[0], true);
    } else {
      this.selectItems(cards);
    }    
  }

  selectItems(items: Card[]) {
    this.selectedItems = items;
    this.drawerState = DrawerState.Peek;
  }

  selectItem(item: Card | null, preview: boolean = false) {
    if (item === null && this.selectedItem === null) {
      return;
    }
    if (item !== null && this.selectedItem !== null && item !== this.selectedItem) {
      return;
    }
    this.selectedItem = item;
    if (item) {
      if (this.itemState === ItemState.None) {
        this.savedDrawerState = this.drawerState;
        this.savedSelectedItems = this.selectedItems;
        this.selectedItems = null;
        if (preview) {
          this.itemState = ItemState.Preview;
          this.drawerState = DrawerState.Peek;
        } else {
          this.itemState = ItemState.Full;
          this.drawerState = DrawerState.Most;
          this.headerState = HeaderState.Hidden;  
        }
      } else {
        this.itemState = ItemState.Full;
        this.drawerState = DrawerState.Most;
        this.headerState = HeaderState.Hidden;
      }
    } else {
      if (this.savedDrawerState) {
        this.drawerState = this.savedDrawerState;
      }
      this.selectedItems = this.savedSelectedItems;
      this.savedDrawerState = null;
      this.savedSelectedItems = null;
      this.headerState = HeaderState.Visible;
      this.itemState = ItemState.None;
    }
  }

  handleEvent(event: string) {
    console.log('EV', this.itemState, event, this.drawerState);
    if (this.itemState === ItemState.Preview) {
      if (event === 'click' || event === 'up' || event === 'close') {
        this.selectItem(null);
      }
    } else if (this.itemState === ItemState.Full) {
      if (event === 'click' || event === 'down') {
        if (this.drawerState === DrawerState.Most) {
          this.drawerState = DrawerState.Hidden;
        }
      }
      if (event === 'close') {
        this.selectItem(null);
      }
    } else if (this.itemState === ItemState.None) {
      if (event === 'click') {
        if (this.drawerState === DrawerState.Peek || this.drawerState === DrawerState.Most || this.drawerState === DrawerState.Full) {
          this.drawerState = DrawerState.Card;
        } else if (this.drawerState === DrawerState.Card) {
          this.drawerState = DrawerState.Peek;
        }
      } else if (event === 'up') {
        if (this.drawerState === DrawerState.Peek) {
          this.drawerState = DrawerState.Most;
        } else if (this.drawerState === DrawerState.Card) {
          this.drawerState = DrawerState.Most;
        } else if (this.drawerState === DrawerState.Most) {
          this.drawerState = DrawerState.Full;
        }
      } else if (event === 'down') {
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

}
