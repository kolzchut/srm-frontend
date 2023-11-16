import { DOCUMENT, Location } from '@angular/common'
import { AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { ApiService } from '../api.service';
import { Card, SearchParams, ViewPort } from '../consts';
import { replaceUrlsWithLinks } from './text-utils';
import { Subscription, timer } from 'rxjs';
import { MarkdownService } from '../markdown.service';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.less']
})
export class CardComponent implements OnInit, OnChanges, AfterViewInit {

  @Input() card: Card;
  @Output() zoomout = new EventEmitter<ViewPort>();

  orgOpen = false;
  snackMessage = '';
  snackVisible = false;
  snackSubscription: Subscription | null = null;
  quickActionsVisible = false;
  obs: IntersectionObserver;
  nonOfficial = false;
  dataSources: SafeHtml[] = [];

  constructor(private api: ApiService, private router: Router, private el: ElementRef, @Inject(DOCUMENT) private document: Document, public md: MarkdownService) {}

  ngOnInit(): void {
    this.obs = new IntersectionObserver((entries) => {
      this.quickActionsVisible = !(entries && entries.length && entries[0].isIntersecting);
    }, { threshold: [0] });
  }

  ngOnChanges(): void {
    this.nonOfficial = !this.card?.organization_kind && this.card?.organization_id?.indexOf('srm9') === 0;
    this.dataSources = this.card?.data_sources?.map(ds => this.md._(ds) || '') || [];
  }

  ngAfterViewInit(): void {
    const first = this.el.nativeElement.querySelector('.visible app-card-action a') as HTMLElement;
    if (first) {
      first.classList.add('primary');
      this.obs.observe(first);
    }
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

  snack(message: string) {
    this.snackMessage = message;
    this.snackVisible = true;
    this.snackSubscription?.unsubscribe();
    this.snackSubscription = timer(3000).subscribe(() => {
      this.snackVisible = false;
      this.snackSubscription = null;
    });
  }
}
