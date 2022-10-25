import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { Card } from '../consts';

@Component({
  selector: 'app-card-action-url',
  templateUrl: './card-action-url.component.html',
  styleUrls: ['./card-action-url.component.less'],
  host: {
    '[class.active]': 'active',
  }
})
export class CardActionUrlComponent implements OnChanges {

  @Input() card: Card;
  @Input() org = false;

  action = '';
  active = false;

  constructor() { }

  ngOnChanges(): void {
    let link = '';
    if (this.org) {
      link = this.card?.organization_urls?.[0].href;
    } else {
      link = this.card?.service_urls?.[0].href || this.card?.branch_urls?.[0].href;
    }
    this.active = false;
    if (link && link.length) {
      this.action = link;
      this.active = true;
    }
  }
}
