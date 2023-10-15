import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { Card } from '../consts';

@Component({
  selector: 'app-card-action-nav',
  templateUrl: './card-action-nav.component.html',
  styleUrls: ['./card-action-nav.component.less'],
  host: {
    '[class.visible]': 'active',
  }
})
export class CardActionNavComponent implements OnChanges {

  @Input() card: Card;
  @Input() org: boolean;
  @Input() compact: boolean;

  action = '';
  active = false;
  display = 'ניווט'

  constructor() { }

  ngOnChanges(): void {
    this.active = false;
    if (this.card?.branch_geometry && this.card?.branch_location_accurate) {
      const coords = [this.card.branch_geometry[1], this.card?.branch_geometry[0]].filter(x => !!x);
      const latLng = coords.join(',');
      if (coords.length === 2 && latLng && latLng.length) {
        this.action = `https://www.google.com/maps/search/?api=1&query=${latLng}`;
        this.active = true;
        if (this.compact) {
          this.display = this.card.branch_address;
        }
      }
    }  
  }
}
