import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Card, SearchParams, _h } from '../consts';
import { LayoutService } from '../layout.service';
import { AnalyticsService } from '../analytics.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PlatformService } from '../platform.service';

@Component({
  selector: 'app-result-stack',
  templateUrl: './result-stack.component.html',
  styleUrls: ['./result-stack.component.less'],
})
export class ResultStackComponent implements OnInit {

  @Input() result: Card;
  @Input() searchParams: SearchParams;
  @Input() index = 0;
  @Output() hover = new EventEmitter<Card>();

  _h = _h;

  showCount = -1;
  // showOrgs = true;

  constructor(public layout: LayoutService, private analytics: AnalyticsService, private router: Router, private route: ActivatedRoute, public platform: PlatformService) { }

  ngOnInit(): void {
    if (this.result?.collapse_hits) {
      const cityNames: any = {};
      this.result.collapse_hits.forEach((h) => {
        const cityName = this.cityName(h);
        if (cityName) {
          if (cityNames[cityName]) {
            cityNames[cityName] += 1;
          } else {
            cityNames[cityName] = 1;
          }
        }
        (h as any)['__city_count'] = h.national_service ? 9999 : (cityNames[cityName] || 0);
      });
      // Sort collapse_hits by __city_count ascending
      this.result.collapse_hits.sort((a, b) => (a as any)['__city_count'] - (b as any)['__city_count']);
    }
    if (this.showCount === -1 && this.collapsibleCount > 0) {
      this.showCount = this.collapsibleCount > 4 ? 4 : this.collapsibleCount;
      if (this.moreAvailable === 1) {
        this.showCount += 1;
      }
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
    if (card.national_service) {
      return 'שירות ארצי';
    } else {
      return _h(card.address_parts, 'primary') || _h(card, 'branch_address');
    }
  }

  orgName(card: Card) {
    return _h(card.organization_name_parts, 'primary') || _h(card, 'organization_short_name') || _h(card, 'organization_name');
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
    } else if (card.organization_short_name) {
      ret += ' של ' + card.organization_short_name;
    }
    ret += ' - פתיחת עמוד השירות';
    return ret;
  }

  selectedItem(event: Event, card: Card, extra?: any) {
    event.preventDefault();
    let card_ = card;
    if (extra) {
      card_ = Object.assign({}, card, extra);
    }
    this.analytics.cardEvent(card_, this.searchParams, this.index, true);
    this.router.navigate(['c', card_.card_id], { relativeTo: this.route, queryParams: {li: this.index}, queryParamsHandling: 'merge', preserveFragment: true });
    return false;
  }
}
