import { DOCUMENT, Location } from '@angular/common'
import { AfterViewInit, Component, ElementRef, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { fromEvent, Subscription, timer } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiService } from '../api.service';
import { Card } from '../consts';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.less']
})
export class CardComponent implements OnInit {

  @Input() card: Card;

  constructor(private api: ApiService, @Inject(DOCUMENT) private document: Document) { }

  ngOnInit(): void {
  }

  get suggestChangesForm() {
    return environment.suggestChangesForm + '?service_name=' + encodeURIComponent(this.card.service_name) + '&id=' + 
           encodeURIComponent(this.card.card_id) + '&url=' + encodeURIComponent(this.document.location.href);
  }

  implementingOffice() {
    return this.card?.service_implements?.split('#')[1] || '';
  }

  implementingLink() {
    const serviceId = (this.card?.service_implements?.split('#')[0] || '').split(':')[1] || '';
    return `https://next.obudget.org/i/activities/gov_social_service/${serviceId}?theme=soproc`;
  }
}
