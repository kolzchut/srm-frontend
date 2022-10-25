import { Component, Input, OnChanges } from '@angular/core';
import { Card } from '../consts';

@Component({
  selector: 'app-card-action-phone',
  templateUrl: './card-action-phone.component.html',
  styleUrls: ['./card-action-phone.component.less'],
  host: {
    '[class.active]': 'active',
  }
})
export class CardActionPhoneComponent implements OnChanges {

  @Input() card: Card;
  @Input() org = false;

  action = '';
  display = '';
  active = false;

  constructor() { }

  ngOnChanges(): void {
    let phone = '';
    if (this.org) {
      phone = this.card?.organization_phone_numbers?.[0];
    } else {
      phone = this.card?.service_phone_numbers?.[0] || this.card?.branch_phone_numbers?.[0];
    }
    this.active = false;
    if (phone && phone.length) {
      this.action = 'tel:' + phone;
      this.display = phone;
      this.active = true;
    }
  }
}
