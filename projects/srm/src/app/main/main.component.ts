import { Component, OnInit } from '@angular/core';
import { DrawerState, HeaderState, ItemState } from '../common/datatypes';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.less']
})
export class MainComponent implements OnInit {

  drawerState: DrawerState = DrawerState.Peek;
  savedDrawerState: DrawerState;
  headerState: HeaderState = HeaderState.Visible;
  itemState: ItemState = ItemState.None;
  selectedItem = null;

  DrawerState = DrawerState;
  ItemState = ItemState;
  HeaderState = HeaderState;

  constructor() { }

  ngOnInit(): void {
  }

  selectItem(item: any) {
    if (item === null && this.selectedItem === null) {
      return;
    }
    if (item !== null && this.selectedItem !== null && item !== this.selectedItem) {
      return;
    }
    this.selectedItem = item;
    if (item) {
      if (this.itemState === ItemState.None) {
        this.itemState = ItemState.Preview;
        this.savedDrawerState = this.drawerState;  
        this.drawerState = DrawerState.Peek;
      } else {
        this.itemState = ItemState.Full;
        this.drawerState = DrawerState.Most;
        this.headerState = HeaderState.Hidden;
      }
    } else {
      this.drawerState = this.savedDrawerState;
      this.headerState = HeaderState.Visible;
      this.itemState = ItemState.None;
    }
  }

  handleEvent(event: string) {
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
