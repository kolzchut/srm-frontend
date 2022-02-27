import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Card } from '../../../common/datatypes';
import { LayoutService } from '../../../layout.service';

@Component({
  selector: 'app-strip-single',
  templateUrl: './single.component.html',
  styleUrls: ['./single.component.less'],
  host: {
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseOut()',
  }
})
export class SingleComponent implements OnInit {

  @Input() card: Card;
  @Output() selected = new EventEmitter<Card>();
  @Output() closed = new EventEmitter<void>();
  @Output() hover = new EventEmitter<Card[]>();

  cards: Card[] = [];

  constructor(public layout: LayoutService) { }

  ngOnInit(): void {
  }

  ngOnChanges() {
    if (this.card) {
      this.cards = [this.card];
    } else {
      this.cards = [];
    }
  }

  onMouseEnter() {
    this.hover.emit(this.cards);
  }

  onMouseOut() {
    this.hover.emit([]);
  }
}
