import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Card, SearchParams, _h } from '../consts';
import { LayoutService } from '../layout.service';
import { PlatformService } from '../platform.service';
import {groupArrayByFeature, mapToArray} from "../../services/arrays";
import {ActivatedRoute, Router} from "@angular/router";

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
  isSingleBranch = false;
  firstBranch = {card_id: ""} as Card;
  constructor(public layout: LayoutService, public platform: PlatformService, private router: Router,private route: ActivatedRoute) { }

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
        .sort((a, b) =>  b.vals.length- a.vals.length);
      }
    if (this.showCount === -1 && this.collapsibleCount > 0) {
      this.showCount = Math.min(4, this.collapsibleCount);
      if (this.moreAvailable === 1) {
        this.showCount += 1;
      }
    }
    this.isSingleBranch = this.checkIfSingleBranchByResult(this.result);
    if (this.isSingleBranch) this.firstBranch = this.getFirstBranch();
  }

  more() {
    this.showCount += 10;
    if (this.showCount > this.collapsibleCount) {
      this.showCount = this.collapsibleCount;
    }
  }
    getFirstBranch(): Card{
    return this.result.collapseHitsByGroups?.[0]?.vals[0]|| this.firstBranch;
  }
  showBranches(key: string, index: number) {
     const group = this.result.collapseHitsByGroups?.find(group => group.key === key)
    if(!group) return;
    if(this.selectedGroup.index == index && this.selectedGroup.key == key) return this.selectedGroupChange.emit({card:[], index:0,result: {} as Card, key:''});
    this.selectedGroupChange.emit({card:group.vals, index,result:this.result, key});
  }
  checkIfSingleBranchByResult(result: Card): boolean {
    return !!(result && result.collapse_hits && result.collapse_hits.length === 1);
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
  selectedItem(event: Event, card: Card, from: string, extra?: any) {
    event.preventDefault();
    let card_ = card;
    if (extra) {
      card_ = Object.assign({}, card, extra);
    }
    this.router.navigate(['c', card_.card_id], {
      relativeTo: this.route,
      queryParams: {li: this.selectedGroup?.index  || 0, from},
      queryParamsHandling: 'merge',
      preserveFragment: true
    });
    return false;
  }
  ariaLabel(card: Card) {
    let ret = '';
    if (card.national_service) {
      ret += 'שירות ארצי: ';
    } else if (card.branch_city) {
      ret += card.branch_city + ' ';
    }
    ret += card.service_name;
    if (card.branch_operating_unit) {
      ret += ' של ' + card.branch_operating_unit;
    } else if (card.organization_name_parts?.primary) {
      ret += ' של ' + card.organization_name_parts.primary;
    } else if (card.organization_short_name) {
      ret += ' של ' + card.organization_short_name;
    }
    ret += ' - פתיחת עמוד השירות';
    return ret;
  }


}
