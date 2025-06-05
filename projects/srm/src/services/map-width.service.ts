import { Injectable } from '@angular/core';
import {LayoutService} from "../app/layout.service";

@Injectable({
  providedIn: 'root'
})
export class MapWidthService {
  public mapWidth = '100vw';

  constructor(private layout: LayoutService) {
    layout.desktop() ? this.mapWidth = 'calc(100vw - 280px)' : this.mapWidth = '100vw';
  }
  setMapFullViewWidth(){
   this.layout.desktop() ? this.mapWidth = 'calc(100vw - 280px)' : this.mapWidth = '100vw';
  }
  setMapHalfOpenWidth(){
    this.layout.desktop() ? this.mapWidth = 'calc(100vw - 704px)' : this.mapWidth = '100vw';
  }
  setMapFullOpenWidth(){
    this.layout.desktop() ? this.mapWidth = 'calc(100vw - 1144px)': this.mapWidth = '100vw';
  }
  setMapWidth(width: string) {
    if(this.layout.mobile()) return;
    this.mapWidth = width;
  }
  getMapWidth() {
    return this.mapWidth
  }

}
