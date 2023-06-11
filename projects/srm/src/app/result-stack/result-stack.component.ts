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
  // showOrgs = true;

  constructor(public layout: LayoutService) { }

  ngOnInit(): void {
    if (this.showCount === -1 && this.collapsibleCount > 0) {
      this.showCount = this.collapsibleCount > 4 ? 4 : this.collapsibleCount;
    }
    if (this.result?.collapse_hits) {
      const cityNames: any = {};
      // const orgName = this.orgName(this.result);
      // this.showOrgs = this.result.collapse_hits.some((h) => this.orgName(h) !== orgName);
      this.result.collapse_hits.forEach((h) => {
        const cityName = this.cityName(h);
        if (cityName) {
          if (cityNames[cityName]) {
            cityNames[cityName] += 1;
          } else {
            cityNames[cityName] = 1;
          }
        }
        (h as any)['__city_count'] = cityName ? cityNames[cityName] : 0;
      });
      // Sort collapse_hits by __city_count ascending
      this.result.collapse_hits.sort((a, b) => (a as any)['__city_count'] - (b as any)['__city_count']);
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

  cityName(card: Card) {
    return card.address_parts?.primary || card.branch_address;
  }

  orgName(card: Card) {
    return card.organization_name_parts?.primary || card.organization_short_name || card.organization_name;
  }

  ariaLabel(card: Card) {
    let ret = '';
    if (card.national_service) {
      ret += 'שירות ארצי: ';
    } else if (card.branch_city) {
      ret += card.branch_city + ' ';
    }
    ret += card.service_name;
    if (card.organization_name_parts?.primary) {
      ret += ' של ' + card.organization_name_parts.primary;
    }
    ret += ' - פתיחת עמוד השירות';
    return ret;
  }
}
