import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { Card } from '../consts';

@Component({
  selector: 'app-card-action-url',
  templateUrl: './card-action-url.component.html',
  styleUrls: ['./card-action-url.component.less'],
  host: {
    '[class.visible]': 'active',
  }
})
export class CardActionUrlComponent implements OnChanges {

  @Input() card: Card;
  @Input() org = false;
  @Input() compact = false;

  action = '';
  active = false;
  display = 'אתר';

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
    this.display = 'אתר';
    if (link?.startsWith('http')) {
      const url = new URL(link);
      const hostname = url.hostname;
      const parts = link.split('/');
      if (hostname?.indexOf('form') > 0 || parts.indexOf('forms') > 0) {
        this.display = 'טופס פניה';
      } else if (hostname?.indexOf('whatsapp') > 0) {
        this.display = 'פניה בוואטסאפ';
      }
    }
  }
}
