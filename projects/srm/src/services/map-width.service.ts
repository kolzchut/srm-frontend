import { Injectable } from '@angular/core';
import {LayoutService} from "../app/layout.service";

@Injectable({
  providedIn: 'root'
})
export class MapWidthService {
  public mapWidth = '100vw';
  public moveLeft = '0px'

  constructor(private layout: LayoutService) {
    this.moveLeft = '0px';
    layout.desktop() ? this.mapWidth = 'calc(100vw - 280px)' : this.mapWidth = '100vw';
  }
  setMapFullViewWidth(){
    this.moveLeft = '0px';
   this.layout.desktop() ? this.mapWidth = 'calc(100vw - 280px)' : this.mapWidth = '100vw';
  }
  setMapHalfOpenWidth(){
    this.moveLeft = '0px';
    this.layout.desktop() ? this.mapWidth = 'calc(100vw - 704px)' : this.mapWidth = '100vw';
  }
  setMapFullOpenWidth(){
    this.moveLeft = '-150px';
    this.layout.desktop() ? this.mapWidth = `calc(100vw - 1144px - ${this.moveLeft})`: this.mapWidth = '100vw';
  }
  setMapWidth(width: string) {
    if(this.layout.mobile()) return;
    this.mapWidth = width;
  }
  setMapMoveLeft(moveLeft: string) {
    if(this.layout.mobile()) return;
    this.moveLeft = moveLeft;
  }
  getMapWidth() {
    return this.mapWidth
  }
  getMoveLeft() {
    return this.moveLeft;
  }

}
