import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Card, SearchParams, _h } from '../consts';
import { LayoutService } from '../layout.service';
import { AnalyticsService } from '../analytics.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PlatformService } from '../platform.service';
import {groupArrayByFeature, mapToArray} from "../../services/arrays";

@Component({
  selector: 'app-result-stack',
  templateUrl: './result-stack.component.html',
  styleUrls: ['./result-stack.component.less'],
})
export class ResultStackComponent implements OnInit {
  @Output() selectedGroupChange = new EventEmitter<{ card: Card[], index:number, result:Card, key: string }>();
  @Input () selectedGroup: { card: Card[], index:number, result:Card, key: string };
  @Input() result: Card;
  @Input() searchParams: SearchParams;
  @Input() index = 0;
  @Output() hover = new EventEmitter<Card>();
  showCount = -1;

  constructor(public layout: LayoutService, public platform: PlatformService) { }

  ngOnInit(): void {
    if (this.result?.collapse_hits) {
      const cityNames: any = {};
      this.result.collapse_hits.forEach((h) => {
        const cityName = this.branchInfo(h);
        if (cityName) {
          if (cityNames[cityName]) {
            cityNames[cityName] += 1;
          } else {
            cityNames[cityName] = 1;
          }
        }
        (h as any)['__city_count'] = h.national_service ? 9999 : (cityNames[cityName] || 0);
      });
      this.result.collapse_hits = this.result.collapse_hits
        .sort((a, b) => !a.branch_city? 1 :-a.branch_city.localeCompare(b.branch_city, 'he-IL'))
        .sort((a,b)=>b.national_service? 1:-1);
      const groups = groupArrayByFeature({array: this.result.collapse_hits, field: 'organization_name'});
      this.result.collapseHitsByGroups = mapToArray(groups)
        .map(group => ({...group, isDisplayed:false}))
        .sort((a, b) => a.vals.length- b.vals.length);
      }
    if (this.showCount === -1 && this.collapsibleCount > 0) {
      this.showCount = Math.min(4, this.collapsibleCount);
      if (this.moreAvailable === 1) {
        this.showCount += 1;
      }
      console.log('showcount:',this.showCount)
    }
  }

  more() {
    this.showCount += 10;
    if (this.showCount > this.collapsibleCount) {
      this.showCount = this.collapsibleCount;
    }
  }

  showBranches(key: string, index: number) {
     const group = this.result.collapseHitsByGroups?.find(group => group.key === key)
    if(!group) return;
    if(this.selectedGroup.index == index && this.selectedGroup.key == key) return this.selectedGroupChange.emit({card:[], index:0,result: {} as Card, key:''});
    this.selectedGroupChange.emit({card:group.vals, index,result:this.result, key});
  }

  get moreAvailable() {
    return this.collapsibleCount - this.showCount;
  }

  get collapsibleCount() {
    return this.result.collapseHitsByGroups?.length || 0;
  }
  branchInfo(card: Card) {
    if (card.national_service) return 'שירות ארצי';
    const primary = _h(card.address_parts, 'primary');
    const secondary = _h(card.address_parts, 'secondary');
    if (primary) {
      if (secondary) return `${primary}, ${secondary}`;
      return primary;
    }
    return _h(card, 'branch_address');
  }

}
