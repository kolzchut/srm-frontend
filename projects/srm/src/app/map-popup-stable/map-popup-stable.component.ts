import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { BranchCards, getPointCards } from '../branch-container/branch-card-utils';
import { Card, SearchParams } from '../consts';

export class CardRoute {

  routeBase: string[] = [];

  set searchParams(searchParams: SearchParams | null) {
    this.routeBase = [];
    if (searchParams?.ac_query) {
      this.routeBase.push('s', searchParams.ac_query);
    }
    this.routeBase.push('c');
    this.routeBase[0] = '/' + this.routeBase[0];
  }

  route(card: Card): string[] {
    return [...this.routeBase, card.card_id];
  }
}


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
  cardRouter = new CardRoute();

  constructor(private api: ApiService) { }

  ngOnChanges(): void {
    console.log('STABLE', this.props);
    if (this.props?.point_id) {
      console.log('POINT CARDS', this.props.point_id, this.searchParams);
      getPointCards(this.api, this.props.point_id, '', this.searchParams).subscribe(({branches, selectedCard, cardBranch}) => {
        if (branches.length === 1) {
          this.cards = branches[0].cards;
          this.branches = [];
        } else {
          this.branches = branches;
          this.cards = [];
        }
      });
    }
    this.cardRouter.searchParams = this.searchParams;
  }
}
