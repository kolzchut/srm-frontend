import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
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
  @Input() fullwidth = false;
  @Input() compact = false;
  @Output() copied = new EventEmitter<string>();

  action = '';
  display = '';
  active = false;
  orgname = '';

  constructor() { }

  ngOnChanges(): void {
    let email = '';
    if (this.org) {
      email = this.card?.organization_email_address;
    } else {
      email = this.card?.service_email_address || this.card?.branch_email_address || this.card?.organization_email_address;
    }
    this.orgname = this.card?.branch_operating_unit || this.card?.organization_name_parts?.primary || this.card?.organization_short_name || this.card?.organization_name || 'ארגון';
    console.log('EMAIL', email);
    this.active = false;
    if (email && email.length) {
      this.action = 'mailto:' + email;
      this.display = (this.fullwidth || this.compact) ? email : 'מייל';
      this.active = true;
    }
  }
}
