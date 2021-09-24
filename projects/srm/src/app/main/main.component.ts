import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.less']
})
export class MainComponent implements OnInit {

  drawerState = 'peek';
  selectedItem = null;

  constructor() { }

  ngOnInit(): void {
  }

  selectItem(item: any) {
    this.selectedItem = item;
    this.drawerState = 'most';
  }

  handleEvent(event: string) {
    if (this.selectedItem) { // Item Mode
      if (event === 'click') {
        if (this.drawerState === 'most') {
          this.selectedItem = null;
          this.drawerState = 'card';
        }
      } else if (event === 'down') {
        this.selectedItem = null;
        this.drawerState = 'card';
      }
    } else { // Result list Mode
      if (event === 'click') {
        if (this.drawerState === 'peek' || this.drawerState === 'most' || this.drawerState === 'full') {
          this.drawerState = 'card';
        } else if (this.drawerState === 'card') {
          this.drawerState = 'peek';
        }
      } else if (event === 'up') {
        if (this.drawerState === 'peek') {
          this.drawerState = 'most';
        } else if (this.drawerState === 'card') {
          this.drawerState = 'most';
        } else if (this.drawerState === 'most') {
          this.drawerState = 'full';
        }
      } else if (event === 'down') {
        if (this.drawerState === 'full') {
          this.drawerState = 'card';
        } else if (this.drawerState === 'most') {
          this.drawerState = 'card';
        } else if (this.drawerState === 'card') {
          this.drawerState = 'peek';
        }
      }
    }
  }

}
