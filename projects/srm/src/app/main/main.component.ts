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
    if (event === 'click') {
      if (this.drawerState === 'peek') {
        if (this.selectedItem) {
          this.drawerState = 'most';
        } else {
          this.drawerState = 'card';
        }
      } else if (this.drawerState === 'most') {
        this.drawerState = 'card';
        this.selectedItem = null;
      } else {
        this.drawerState = 'peek';
      }
    }
  }

}
