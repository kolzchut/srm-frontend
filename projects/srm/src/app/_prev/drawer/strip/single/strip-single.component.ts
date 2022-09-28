import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Card, Point } from '../../../common/datatypes';
import { LayoutService } from '../../../layout.service';

@Component({
  selector: 'app-strip-single',
  templateUrl: './strip-single.component.html',
  styleUrls: ['./strip-single.component.less'],
  host: {
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseOut()',
  }
})
export class StripSingleComponent implements OnInit {

  @Input() card: Card;
  @Output() selected = new EventEmitter<Card>();
  @Output() closed = new EventEmitter<void>();
  @Output() hover = new EventEmitter<string | null>();

  constructor(public layout: LayoutService) { }

  ngOnInit(): void {
  }

  ngOnChanges() {
  }

  onMouseEnter() {
    this.hover.emit(this.card?.point_id || null);
  }

  onMouseOut() {
    this.hover.emit(null);
  }
}
