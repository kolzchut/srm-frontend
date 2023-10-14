import { DOCUMENT, Location } from '@angular/common'
import { AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { ApiService } from '../api.service';
import { Card, SearchParams, ViewPort } from '../consts';
import { replaceUrlsWithLinks } from './text-utils';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.less']
})
export class CardComponent implements OnInit {

  @Input() card: Card;
  @Output() zoomout = new EventEmitter<ViewPort>();

  orgOpen = false;

  constructor(private api: ApiService, private router: Router, @Inject(DOCUMENT) private document: Document) { }

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

  showAllBranches() {
    const params = new SearchParams();
    params.org_id = this.card.organization_id;
    this.api.getCounts(params, false).subscribe((counts) => {
      console.log('ACTION ZOOMOUT', counts);
      this.zoomout.emit(counts.viewport);
      this.router.navigate(['/s', this.card.organization_id]);
    });
  }

  hasOrgActions() {
    return !!this.card?.organization_phone_numbers?.[0] || !!this.card?.organization_email_address;
  }

  format(text: string) {
    return replaceUrlsWithLinks(text);
  }
}
