import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { getPointCards } from '../branch-container/branch-card-utils';

@Component({
  selector: 'app-card-branch-services',
  templateUrl: './card-branch-services.component.html',
  styleUrls: ['./card-branch-services.component.less'],
  host: {
    '[class.visible]': 'cards.length > 0',
  }
})
export class CardBranchServicesComponent implements OnInit {

  @Input() card: any;

  cards: any[] = [];

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    getPointCards(this.api, this.card.point_id, this.card.card_id, null).subscribe(({branches, selectedCard, cardBranch}) => {
      this.cards = (cardBranch?.cards || []).filter(c => c.card_id !== this.card.card_id);
    });
  }

}
