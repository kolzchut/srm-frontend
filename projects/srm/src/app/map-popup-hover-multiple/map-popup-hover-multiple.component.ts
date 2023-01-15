import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-map-popup-hover-multiple',
  templateUrl: './map-popup-hover-multiple.component.html',
  styleUrls: ['./map-popup-hover-multiple.component.less']
})
export class MapPopupHoverMultipleComponent implements OnInit {

  @Input() props: any;

  constructor() { }

  ngOnInit(): void {
  }

}
