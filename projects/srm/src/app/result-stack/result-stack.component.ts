import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Card, SearchParams } from '../consts';
import { LayoutService } from '../layout.service';
import { PlatformService } from '../platform.service';
import {groupArrayByFeature, mapToArray} from "../../services/arrays";
import {ActivatedRoute, Router} from "@angular/router";
import ariaLabel from "../../services/result-stack-utilities/ariaLabelBuilder";
import StringsBuilder from "../../services/result-stack-utilities/stringsBuilder";
import stringsBuilder from "../../services/result-stack-utilities/stringsBuilder";
import {AnalyticsService} from "../analytics.service";

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
  constructor(public layout: LayoutService, public platform: PlatformService, private router: Router,private route: ActivatedRoute,private analyticsService: AnalyticsService) { }

  ngOnInit(): void {

    if (this.result?.collapse_hits) {
      const cityNames: any = {};
      this.result.collapse_hits.forEach((h) => {
        const cityName = stringsBuilder.branchInfo(h);
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
  scrollToTop() {
    (document.getElementById('topOfSearchResults') as HTMLSpanElement)?.scrollIntoView({ behavior: 'smooth' });
  }
  clickedBranches(key: string, index: number) {
    this.scrollToTop();
    this.showBranches(key, index);
  }
  showBranches(key: string, index: number) {
     const group = this.result.collapseHitsByGroups?.find(group => group.key === key)
    if(!group) return;
    if(this.selectedGroup.index == index && this.selectedGroup.key == key) return this.selectedGroupChange.emit({card:[], index:0,result: {} as Card, key:''});
    this.analyticsService.openBranchesEvent(this.selectedGroup.result.card_id)
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

  protected readonly ariaLabel = ariaLabel;
  protected readonly stringsBuilder = StringsBuilder;
}
