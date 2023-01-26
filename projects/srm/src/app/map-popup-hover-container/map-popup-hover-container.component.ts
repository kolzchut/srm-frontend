import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs';
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
  @Output() stable = new EventEmitter<void>();

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
      if (this.props?.processed) {
        this.ready = true;
        if (this.props?.card) {
          this.card = this.props.card;
        } else {
          this.multiProps = this.props;
        }
      } else {
        getPointCards(this.api, this.props.point_id, '', this.searchParams).subscribe(({branches, selectedCard, cardBranch}) => {
          this.multiProps = {
            service_count: 0,
            branch_count: branches.length,
            full_title: null,
            point_id: this.props.point_id,
            branch_geometry: this.props.branch_geometry,
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

}
