import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Card } from '../../common/datatypes';
import { HighlighterService } from '../../highlighter.service';

@Component({
  selector: 'app-service-card',
  templateUrl: './service-card.component.html',
  styleUrls: ['./service-card.component.less'],
  host: {
    '[class.clickable]' : 'clickable',
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseOut()',
  }
})
export class ServiceCardComponent implements OnInit {

  @Input() card: Card;
  @Input() highlight = false;
  @Input() closeable = false;
  @Input() clickable = true;
  @Output() closed = new EventEmitter<void>();
  @Output() hover = new EventEmitter<Card | null>();

  constructor() { }

  ngOnInit(): void {
  }

  onMouseEnter() {
    this.hover.emit(this.card);
  }

  onMouseOut() {
    this.hover.emit(null);
  }
}
