import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { BranchCards, getPointCards } from '../branch-container/branch-card-utils';
import { Card, SearchParams } from '../consts';

@Component({
  selector: 'app-map-popup-stable',
  templateUrl: './map-popup-stable.component.html',
  styleUrls: ['./map-popup-stable.component.less']
})
export class MapPopupStableComponent implements OnChanges {

  @Input() props: any;
  @Input() searchParams: SearchParams | null;

  cards: Card[] = [];
  branches: BranchCards[] = [];
  routeBase: string[] = [];

  constructor(private api: ApiService) { }

  ngOnChanges(): void {
    console.log('STABLE', this.props);
    if (this.props?.point_id) {
      if (this.props?.branch_count === 1) {
        this.api.getPoint(this.props.point_id, this.searchParams).subscribe(cards => {
          console.log('STABLE CARDS', cards);
          this.cards = cards;
        });
      } else {
        console.log('POINT CARDS', this.props.point_id, this.searchParams);
        getPointCards(this.api, this.props.point_id, '', this.searchParams).subscribe(({branches, selectedCard, cardBranch}) => {
          this.branches = branches;
        });
      }
    }
    this.routeBase = [];
    if (this.searchParams?.ac_query) {
      this.routeBase.push('s', this.searchParams.ac_query);
    }
    this.routeBase.push('c');
    this.routeBase[0] = '/' + this.routeBase[0];
  }

  route(card: Card): string[] {
    return [...this.routeBase, card.card_id];
  }
}
