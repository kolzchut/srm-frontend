import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Card, Point } from '../../../common/datatypes';
import { StripMultipleComponent } from '../strip-multiple/strip-multiple.component';

@Component({
  selector: 'app-popup-multiple',
  templateUrl: './popup-multiple.component.html',
  styleUrls: ['./popup-multiple.component.less'],
  host: {
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseOut()',
  }
})
export class PopupMultipleComponent implements OnInit {

  @Input() point: Point;
  @Output() selected = new EventEmitter<Card>();
  @Output() selectMulti = new EventEmitter<Point>();
  @Output() closed = new EventEmitter<void>();
  @Output() hover = new EventEmitter<string | null>();

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

  onMouseEnter() {
    this.hover.emit(this.point?.point_id || null);
  }

  onMouseOut() {
    this.hover.emit(null);
  }
}
