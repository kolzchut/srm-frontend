import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { Card } from '../consts';

@Component({
  selector: 'app-card-action-email',
  templateUrl: './card-action-email.component.html',
  styleUrls: ['./card-action-email.component.less'],
  host: {
    '[class.visible]': 'active',
  }
})
export class CardActionEmailComponent implements OnChanges {

  @Input() card: Card;
  @Input() org = false;

  action = '';
  display = '';
  active = false;

  constructor() { }

  ngOnChanges(): void {
    let email = '';
    if (this.org) {
      email = this.card?.organization_email_address;
    } else {
      email = this.card?.service_email_address || this.card?.branch_email_address;
    }
    console.log('EMAIL', email);
    this.active = false;
    if (email && email.length) {
      this.action = 'mailto:' + email;
      this.display = this.org ? email : 'מייל';
      this.active = true;
    }
  }
}
