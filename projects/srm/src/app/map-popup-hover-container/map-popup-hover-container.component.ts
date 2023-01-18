import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { getPointCards } from '../branch-container/branch-card-utils';
import { Card, SearchParams } from '../consts';

@Component({
  selector: 'app-map-popup-hover-container',
  templateUrl: './map-popup-hover-container.component.html',
  styleUrls: ['./map-popup-hover-container.component.less']
})
export class MapPopupHoverContainerComponent implements OnInit {

  @Input() props: any;
  @Input() searchParams: SearchParams | null;

  ready = false;

  card: Card | null = null;
  multiProps: any = null;

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    console.log('HOVER CONTAINER', this.props);
    if (this.props?.card_id) {
      this.api.getCard(this.props.card_id).subscribe(card => {
        this.card = card;
        this.ready = true;
      });
    } else if (this.props?.point_id) {
      getPointCards(this.api, this.props.point_id, '', this.searchParams).subscribe(({branches, selectedCard, cardBranch}) => {
        this.multiProps = {
          service_count: 0,
          branch_count: branches.length,
          full_title: null,
        };
        let card: Card | null = null;
        branches.forEach(branch => {
          this.multiProps.service_count += branch.cards.length;
          if (!card) {
            card = branch.cards[0];
          }
          this.multiProps.full_title = branch.cards[0].organization_name_parts?.primary || branch.cards[0].organization_name;
        });
        if (this.multiProps.service_count === 1) {
          this.card = card;
          this.multiProps = null;
          this.ready = true;
        } else {
          if (this.multiProps.branch_count > 1)  {
            this.multiProps.full_title += ' +' + (this.multiProps.branch_count - 1);
          }
          this.ready = true;
        }
      });
    }
    
  }

}
