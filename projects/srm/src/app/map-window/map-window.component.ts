import { Component, Input, OnInit } from '@angular/core';

export enum MapWindowMode {
  Card = 'card',
  Point = 'point',
  Inaccurate = 'inaccurate',
  NationalService = 'national-service',
};

@Component({
  selector: 'app-map-window',
  templateUrl: './map-window.component.html',
  styleUrls: ['./map-window.component.less']
})
export class MapWindowComponent implements OnInit {

  @Input() mode: MapWindowMode;
  @Input() link: string[] | null;

  MapWindowMode = MapWindowMode;

  constructor() { }

  ngOnInit(): void {
  }

}
