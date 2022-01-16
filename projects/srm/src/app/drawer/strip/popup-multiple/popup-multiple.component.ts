import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Card } from '../../../common/datatypes';
import { StripMultipleComponent } from '../strip-multiple/strip-multiple.component';

@Component({
  selector: 'app-popup-multiple',
  templateUrl: './popup-multiple.component.html',
  styleUrls: ['./popup-multiple.component.less']
})
export class PopupMultipleComponent implements OnInit {

  @Input() cards: Card[] | null;
  @Output() selected = new EventEmitter<Card>();
  @Output() closed = new EventEmitter<void>();
  @ViewChild(StripMultipleComponent) strip: StripMultipleComponent;

  constructor() { }

  ngOnInit(): void {
  }

  onRight() {
    this.strip.scroll(1);
  }

  onLeft() {
    this.strip.scroll(-1);
  }

  get rightPossible() {
    return this.strip? this.strip.rightPossible : false;
  }

  get leftPossible() {
    return this.strip? this.strip.leftPossible : true;
  }
}
