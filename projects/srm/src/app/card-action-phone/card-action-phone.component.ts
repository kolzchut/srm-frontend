import { Component, Input, OnChanges } from '@angular/core';
import { Card } from '../consts';

@Component({
  selector: 'app-card-action-phone',
  templateUrl: './card-action-phone.component.html',
  styleUrls: ['./card-action-phone.component.less'],
  host: {
    '[class.visible]': 'active',
  }
})
export class CardActionPhoneComponent implements OnChanges {

  @Input() card: Card;
  @Input() org = false;

  action = '';
  display = '';
  active = false;
  orgname = '';
  
  constructor() { }

  ngOnChanges(): void {
    let phone = '';
    if (this.org) {
      phone = this.card?.organization_phone_numbers?.[0];
    } else {
      phone = this.card?.service_phone_numbers?.[0] || this.card?.branch_phone_numbers?.[0] || this.card?.organization_phone_numbers?.[0];
    }
    this.orgname = this.card?.organization_name_parts.primary || this.card?.organization_short_name || this.card?.organization_name || 'ארגון';
    this.active = false;
    if (phone && phone.length) {
      this.action = 'tel:' + phone;
      this.display = phone;
      this.active = true;
    }
  }
}
