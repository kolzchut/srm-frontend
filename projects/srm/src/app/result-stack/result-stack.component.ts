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
  showOrgs = true;

  constructor(public layout: LayoutService) { }

  ngOnInit(): void {
    if (this.showCount === -1 && this.collapsibleCount > 0) {
      this.showCount = this.collapsibleCount > 4 ? 4 : this.collapsibleCount;
    }
    if (this.result?.collapse_hits) {
      const orgName = this.orgName(this.result);
      this.showOrgs = this.result.collapse_hits.some((h) => this.orgName(h) !== orgName);
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

  orgName(card: Card) {
    return card.organization_name_parts?.primary || card.organization_short_name || card.organization_name;
  }
}
