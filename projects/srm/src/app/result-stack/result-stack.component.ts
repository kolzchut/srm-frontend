import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Card, SearchParams, _h } from '../consts';
import { LayoutService } from '../layout.service';

@Component({
  selector: 'app-result-stack',
  templateUrl: './result-stack.component.html',
  styleUrls: ['./result-stack.component.less'],
})
export class ResultStackComponent implements OnInit {

  @Input() result: Card;
  @Input() searchParams: SearchParams;
  @Output() hover = new EventEmitter<Card>();

  _h = _h;

  showCount = -1;

  constructor(public layout: LayoutService) { }

  ngOnInit(): void {
    if (this.showCount === -1 && this.collapsibleCount > 0) {
      this.showCount = this.collapsibleCount > 4 ? 4 : this.collapsibleCount;
    }
  }

  more() {
    this.showCount += 10;
    if (this.showCount > this.collapsibleCount) {
      this.showCount = this.collapsibleCount;
    }
  }

  get moreAvailable() {
    return this.collapsibleCount - this.showCount;
  }

  get collapsible() {
    return this.result.collapsed;
  }

  get collapsibleCount() {
    const c = this.result.collapsed_count;
    return c;
  }
}
