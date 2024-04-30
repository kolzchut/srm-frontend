import { Location } from '@angular/common';
import { Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { LngLatLike } from 'mapbox-gl';
import { SeoSocialShareService } from 'ngx-seo';
import { EMPTY, forkJoin, from, fromEvent, Observable, ReplaySubject, Subject, Subscription, timer } from 'rxjs';
import { distinctUntilChanged, first, map, switchMap, tap, withLatestFrom, zipWith } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { Card, SearchParams } from '../consts';
import { MapWindowMode } from '../map-window/map-window.component';
import { MapComponent } from '../map/map.component';
import { PlatformService } from '../platform.service';
import { swipe } from '../swipe';
import { DOCUMENT } from '@angular/common';
import { LayoutService } from '../layout.service';
import { BranchCards, getPointCards } from './branch-card-utils';
import { A11yService } from '../a11y.service';
import { SearchService } from '../search.service';


type AuxParams = {
  searchParams: SearchParams,
  pointId: string,
  cardId: string,
  hash: string,
};


@UntilDestroy()
@Component({
  selector: 'app-branch-container',
  templateUrl: './branch-container.component.html',
  styleUrls: ['./branch-container.component.less'],
  host: {
    '[class.stage-point]': '!!pointId',
    '[class.stage-card]': '!!cardId',
    '[class.bare-point]': 'barePoint',
  }
})
export class BranchContainerComponent implements OnInit, OnChanges {

  @Input() cardId = '';
  @Input() pointId = '';
  @Input() searchParams: SearchParams;
  @Output() size = new EventEmitter<number>();
  @Output() markerProps = new EventEmitter<any>();
  @ViewChild('content') content: ElementRef;
  @ViewChild('backToSearch') backToSearch: ElementRef;

  headerLink: string[] = ['../..'];

  branches: BranchCards[] = [];
  cardBranch: BranchCards | null = null;
  card: Card | null = null;
  visibleCard: Card | null = null;

  parametersQueue = new ReplaySubject<AuxParams>(1);
  obs: IntersectionObserver | null = null;

  barePoint = false;

  MWM = MapWindowMode;

  constructor(private api: ApiService, public location: Location, private router: Router, private route: ActivatedRoute,
              private el: ElementRef, private seo: SeoSocialShareService, private platform: PlatformService, private layout: LayoutService,
              private a11y: A11yService, public searchSvc: SearchService,
              @Inject(DOCUMENT) private document: any) { }

  ngOnInit(): void {
    this.parametersQueue.pipe(
      untilDestroyed(this),
      tap((p) => {
        p.hash = p.searchParams?.searchHash + p.cardId + p.pointId;
      }),
      distinctUntilChanged((a, b) => a.hash === b.hash),
      switchMap((p) => {
        return getPointCards(this.api, p.pointId, p.cardId, p.searchParams).pipe(
          map(({branches, selectedCard, cardBranch}) => {
            return {p, branches, selectedCard, cardBranch};
          }),
        );
      })
    ).subscribe(({p, branches, selectedCard, cardBranch}) => {
      this.branches = branches;
      this.cardBranch = cardBranch;
      this.card = selectedCard;
      if (p.cardId && this.card) {
        this.a11y.setSeoTitle(`${this.card.service_name} / ${this.card.organization_short_name || this.card.organization_name} | כל שירות`);
        if (this.card.service_description) {
          this.seo.setDescription(this.card.service_description);
        }
      }
      this.seo.setUrl(`${this.document.location.origin}/p/${p.pointId}`);
    });
  }

  ngOnChanges(): void {
    this.parametersQueue.next({searchParams: this.searchParams, pointId: this.pointId, cardId: this.cardId, hash: ''});
    this.platform.browser(() => {
      timer(0).subscribe(() => {    
        const el = this.content?.nativeElement as HTMLElement;
        if (el && this.platform.browser()) {
          const size = window.innerHeight - el.getBoundingClientRect().top;
          this.size.emit(size);
        }
      });
      timer(100).subscribe(() => {
        this.setupObserver();
      });
    });
    this.barePoint = !this.searchParams?.ac_query && !this.cardId;
  }

  ngAfterViewInit(): void {
    this.platform.browser(() => {
      if (this.layout.desktop()) {
        this.goUp();
      };
    });
    fromEvent<TouchEvent>(this.backToSearch.nativeElement, 'touchstart')
    .pipe(
      untilDestroyed(this),
      swipe(this.backToSearch.nativeElement)
    ).subscribe((diff) => {
      if (diff < -50) {
        this.goUp();
      }
    });
  }

  goUp(): void {
    this.router.navigate(['../..'], {relativeTo: this.route, queryParamsHandling: 'preserve'});
  }

  setupObserver(): void {
    this.platform.browser(() => {
      this.visibleCard = null;
      this.obs?.disconnect();
      this.obs = null;
      this.obs = new IntersectionObserver((entries) => {
        const intersecting = entries.filter(e => e.isIntersecting);
        if (intersecting.length > 0) {
          const target = intersecting[0].target as HTMLElement;
          const slideCard: Card = JSON.parse(target.getAttribute('data-card') as string);
          const title = slideCard.organization_name_parts?.primary || slideCard.organization_short_name || slideCard.organization_name;
          const response_category = slideCard.response_category;
          const card_id = slideCard.card_id;
          this.visibleCard = slideCard;
          this.markerProps.emit({title, response_category, card_id});
        }
      }, {threshold: 0.5});
      this.content?.nativeElement?.querySelectorAll('app-point-result-stack .card').forEach((el: HTMLElement) => {
        this.obs?.observe(el);
      });
    });
  }

  ngOnDestroy(): void {
    this.obs?.disconnect();
    this.obs = null;
  }

  get actionsCard(): Card | null{
    return this.visibleCard || this.card;
  }

  get landingPage(): boolean {
    return !this.searchParams?.original_query && !this.pointId;
  }

  get inaccurate(): boolean {
    return !this.actionsCard?.branch_location_accurate && !this.nationalService;
  }

  get nationalService(): boolean {
    return !!this.actionsCard?.national_service;
  }
}
