import {Component, EventEmitter, Input, Output} from '@angular/core'; // Add Input here
import { Card, SearchParams} from '../consts';
import {AnalyticsService} from "../analytics.service";
import {ActivatedRoute, Router} from "@angular/router";
import {LayoutService} from "../layout.service";
import ariaLabel from "../../services/result-stack-utilities/ariaLabelBuilder";
import stringsBuilder from "../../services/result-stack-utilities/stringsBuilder";
import {MapWidthService} from "../../services/map-width.service";


@Component({
  selector: 'app-search-results-branches-list',
  templateUrl: './search-results-branches-list.component.html',
  styleUrls: ['./search-results-branches-list.component.less']
})
export class SearchResultsBranchesListComponent {
  @Input() selectedGroup: { card: Card[], index:number,result: Card, key: string };
  @Input() searchParams: SearchParams;
  @Input() branchListTopOffset = 0;
  @Output() close = new EventEmitter<void>();
  @Output() hover = new EventEmitter<Card>();
  layout = { desktop: false };

  constructor( private analytics: AnalyticsService, private router: Router, private route: ActivatedRoute, private layoutService: LayoutService, private mapWidthService: MapWidthService) {
    this.layout.desktop = this.layoutService.desktop();
  }
  protected readonly ariaLabel = ariaLabel;
  protected readonly stringsBuilder = stringsBuilder;

  selectedItem(event: Event, card: Card, from: string, extra?: any) {
    this.mapWidthService.setMapFullViewWidth()
    event.preventDefault();
    let card_ = card;
    if (extra) {
      card_ = Object.assign({}, card, extra);
    }
    this.analytics.cardEvent(card_, this.searchParams, this.selectedGroup?.index || 0, true);
    this.router.navigate(['c', card_.card_id], {
      relativeTo: this.route,
      queryParams: {li: this.selectedGroup?.index  || 0, from},
      queryParamsHandling: 'merge',
      preserveFragment: true
    });
    return false;
  }
  trackByCardId(index: number, branch: any): string {
    return branch.card_id;
  }

}
