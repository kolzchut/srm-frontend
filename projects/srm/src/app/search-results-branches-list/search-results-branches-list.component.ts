import {Component, EventEmitter, Input, Output} from '@angular/core'; // Add Input here
import {_h, Card, SearchParams} from '../consts';
import {AnalyticsService} from "../analytics.service";
import {ActivatedRoute, Router} from "@angular/router";
import {LayoutService} from "../layout.service"; // Ensure the correct path to Card is used

@Component({
  selector: 'app-search-results-branches-list',
  templateUrl: './search-results-branches-list.component.html',
  styleUrls: ['./search-results-branches-list.component.less']
})
export class SearchResultsBranchesListComponent {
  @Input() selectedGroup: { card: Card[], index:number,result: Card, key: string };
  @Input() searchParams: SearchParams;
  @Output() close = new EventEmitter<void>();
  @Output() hover = new EventEmitter<Card>();
  layout = { desktop: false };

  constructor( private analytics: AnalyticsService, private router: Router, private route: ActivatedRoute, private layoutService: LayoutService) {}
  ngOnInit(): void {
    this.layout.desktop = this.layoutService.desktop();
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

  selectedItem(event: Event, card: Card, from: string, extra?: any) {
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

  branchName({branch_name}: Card) {
    if (!branch_name) return "";
    return ` ${branch_name}`;
  }

  orgName(card: Card) {
    return _h(card, 'branch_operating_unit') || _h(card.organization_name_parts, 'primary') || _h(card, 'organization_short_name') || _h(card, 'organization_name');
  }
  trackByCardId(index: number, branch: any): string {
    return branch.card_id;
  }

}
