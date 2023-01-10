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


type BranchCards = {cards: Card[], hidden: Card[]};

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
              @Inject(DOCUMENT) private document: any) { }

  ngOnInit(): void {
    this.parametersQueue.pipe(
      untilDestroyed(this),
      tap((p) => {
        p.hash = p.searchParams?.searchHash + p.cardId + p.pointId;
      }),
      distinctUntilChanged((a, b) => a.hash === b.hash),
      switchMap((p) => {
        // console.log('GET POINT', ret.p.searchParams);
        return forkJoin([
          this.api.getPoint(p.pointId, p.searchParams),
          this.api.getPoint(p.pointId),
        ]).pipe(
          map(([cards, allCards]) => {
            return {cards, allCards, p};
          })
        );
      })
    ).subscribe(({p, cards, allCards}) => {
      cards = cards.sort((a, b) => a.branch_id.localeCompare(b.branch_id));
      this.branches = [];
      let branch: BranchCards = {cards: [], hidden: []};
      for (const card of cards) {
        if (branch.cards.length === 0 || branch.cards[0].branch_id !== card.branch_id) {
          branch = {cards: [], hidden: []}
          this.branches.push(branch);
        }
        branch.cards.push(card);
      }
      for (const branch of this.branches) {
        const ids = branch.cards.map(c => c.card_id);
        if (ids.length > 0) {
          branch.hidden = allCards.filter(c => {
            return !ids.includes(c.card_id) && c.branch_id === branch.cards[0].branch_id;
          });
        }
        for (const card of [...branch.cards, ...branch.hidden]) {
          if (card.card_id === p.cardId) {
            this.cardBranch = branch;
            this.card = card;
          }
        }
        // console.log('CARDS', branch.cards[0].branch_id, cards.filter(c => c.branch_id === branch.cards[0].branch_id));
        // console.log('ALL CARDS', allCards.filter(c => c.branch_id === branch.cards[0].branch_id));
      }
      if (p.cardId && this.card) {
        this.seo.setTitle(`כל שירות -  ${this.card.service_name}`);
      } else {
        this.seo.setTitle(`כל שירות`);
      }
      this.seo.setUrl(this.document.location.href);
    });
  }

  ngOnChanges(): void {
    this.parametersQueue.next({searchParams: this.searchParams, pointId: this.pointId, cardId: this.cardId, hash: ''});
    timer(0).subscribe(() => {    
      const el = this.content?.nativeElement as HTMLElement;
      if (el) {
        const size = window.innerHeight - el.getBoundingClientRect().top;
        this.size.emit(size);
      }
    });
    timer(100).subscribe(() => {
      this.setupObserver();
    });
    this.barePoint = !this.searchParams?.ac_query && !this.cardId;
  }

  ngAfterViewInit(): void {
    if (this.layout.desktop) {
      this.router.navigate(['/'])
    };
    fromEvent<TouchEvent>(this.backToSearch.nativeElement, 'touchstart')
    .pipe(
      untilDestroyed(this),
      swipe(this.backToSearch.nativeElement)
    ).subscribe((diff) => {
      console.log('back to search swipe', diff);
      if (diff < -50) {
        this.router.navigate(['../..'], {relativeTo: this.route, queryParamsHandling: 'preserve'});
      }
    });
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
          const slideCard = JSON.parse(target.getAttribute('data-card') as string);
          const title = slideCard.organization_name_parts?.primary || slideCard.organization_name;
          const response_category = slideCard.response_category;
          this.visibleCard = slideCard;
          this.markerProps.emit({title, response_category});
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
