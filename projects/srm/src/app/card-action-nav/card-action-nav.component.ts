import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { Card } from '../consts';

@Component({
  selector: 'app-card-action-nav',
  templateUrl: './card-action-nav.component.html',
  styleUrls: ['./card-action-nav.component.less'],
  host: {
    '[class.active]': 'active',
  }
})
export class CardActionNavComponent implements OnChanges {

  @Input() card: Card;

  action = '';
  active = false;

  constructor() { }

  ngOnChanges(): void {
    const coords = [this.card?.branch_geometry?.[1], this.card?.branch_geometry?.[0]];
    const latLng = coords.filter(x => !!x).join(',');
    this.active = false;
    if (latLng && latLng.length) {
      this.action = `https://www.google.com/maps/search/?api=1&query=${latLng}`;
      this.active = true;
      console.log('NAV', this.action);
    }
  }
}
