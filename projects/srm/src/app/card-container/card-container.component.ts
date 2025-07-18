import { state, style, trigger, transition, animate, query } from '@angular/animations';
import { Location } from '@angular/common';
import { Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { LngLatLike } from 'mapbox-gl';
import { SeoSocialShareService } from 'ngx-seo';
import { EMPTY, forkJoin, from, fromEvent, Observable, ReplaySubject, Subject, Subscription, timer } from 'rxjs';
import { debounceTime, distinctUntilChanged, first, map, switchMap, tap, withLatestFrom, zipWith } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { Card, SearchParams, ViewPort } from '../consts';
import { MapWindowMode } from '../map-window/map-window.component';
import { MapComponent } from '../map/map.component';
import { PlatformService } from '../platform.service';
import { swipe } from '../swipe';
import { DOCUMENT } from '@angular/common';
import { AnalyticsService } from '../analytics.service';
import { A11yService } from '../a11y.service';
import { SearchService } from '../search.service';
import {MapWidthService} from "../../services/map-width.service";


type BranchCards = {cards: Card[], hidden: Card[]};

type AuxParams = {
  searchParams: SearchParams,
  cardId: string,
  hash: string,
};


@UntilDestroy()
@Component({
  selector: 'app-card-container',
  templateUrl: './card-container.component.html',
  styleUrls: ['./card-container.component.less'],
  host: {
    '[class.stage-point]': '!!pointId',
    '[class.stage-card]': '!!cardId',
    '[class.bare-point]': 'barePoint',
    '[@slideInOut]': '"in"'
  },
  animations: [
    trigger('slideInOut', [
      state('in', style({transform: 'translateY(0%)'})),
      transition(":enter", [
        // query('.content', [
        //   style({ transform: 'translateY(100%)' }),
        //   animate(
        //     300, style({ transform: 'translateY(0%)' })
        //   )
        // ]),
        // query('.map-window', [
        //   style({ opacity: 0 }),
        //   animate(
        //     600, style({ opacity: 1 })
        //   )
        // ]),
      ]),
      transition(":leave", [
        // query('.map-window', [
        //   style({ opacity: 0 }),
        // ]),
        // query('.content', [
        //   style({ transform: 'translateY(0%)' }),
        //   animate(
        //     300, style({ transform: 'translateY(100%)' })
        //   )
        // ])
      ])
    ])
  ]
})
export class CardContainerComponent implements OnInit, OnChanges {

  @Input() cardId = '';
  @Input() searchParams: SearchParams;
  @Output() center = new EventEmitter<LngLatLike>();
  @Output() size = new EventEmitter<number>();
  @Output() zoomout = new EventEmitter<ViewPort>();
  @ViewChild('content') content: ElementRef;
  @ViewChild('scrolled') scrolled: ElementRef;
  @ViewChild('mapWindow') mapWindow: ElementRef;

  branchLink: string[] | null = null;

  card: Card | null = null;

  parametersQueue = new ReplaySubject<AuxParams>(1);

  MWM = MapWindowMode;

  showQuickActions = false;

  constructor(private api: ApiService, public location: Location, private router: Router, private route: ActivatedRoute,
              private el: ElementRef, private seo: SeoSocialShareService, public platform: PlatformService,
              private analytics: AnalyticsService, private a11y: A11yService, public searchSvc: SearchService,
              @Inject(DOCUMENT) private document: Document, private mapWidthService: MapWidthService) {
    if (platform.safari) {
      this.showQuickActions = true;
    }
  }

  ngOnInit(): void {
    this.mapWidthService.setMapFullViewWidth()
    this.parametersQueue.pipe(
      untilDestroyed(this),
      tap((p) => {
        p.hash = p.searchParams?.searchHash + p.cardId;
      }),
      distinctUntilChanged((a, b) => a.hash === b.hash),
      switchMap((p) => {
        return this.api.getCard(p.cardId).pipe(map(card => {
          console.log('CARD', p, card);
          return {p, card};
        }));
      }),
      map(({p, card}) => {
        this.card = card;
        console.log('ACTION CARD', this.card?.branch_geometry);
        if (this.card?.branch_geometry) {
          const geom: [number, number] = this.card.branch_geometry;
          this.center.emit(geom);
        }
        if (this.card) {
          let title = `${this.card.service_name} / ${this.card.branch_operating_unit || this.card.organization_short_name || this.card.organization_name}`;
          const city = this.card.national_service ? 'שירות ארצי' : this.card.branch_city;
          if (city) {
            title += ` / ${city}`;
          }
          title += ' | כל שירות';
          this.a11y.setSeoTitle(title);
          if (this.card.service_description) {
            this.seo.setDescription(this.card.service_description);
          }
        }
        const loc = this.document.location;
        this.seo.setUrl(`${loc.origin}/c/${this.cardId}`);
        this.platform.browser(() => {
          this.calculateExitLink();
          (this.scrolled?.nativeElement as HTMLElement)?.scrollTo(0, 0);
        });
        return card;
      }),
      distinctUntilChanged((a, b) => a.card_id === b.card_id),
      debounceTime(this.platform.browser() ? 3000 : 0),
      tap((card) => {
        this.platform.browser(() => {
          const li = this.route.snapshot.queryParams['li'];
          let index = 0;
          if (li) {
            index = parseInt(li, 10);
          }
          const from = this.route.snapshot.queryParams['from'];
          if (from || li) {
            this.router.navigate([], {relativeTo: this.route, queryParams: {from: null, li: null}, queryParamsHandling: 'merge', replaceUrl: true, preserveFragment: true});
          }
          this.analytics.cardEvent(card, this.searchParams, index, false, from);
        });
      })
    ).subscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.parametersQueue.next({searchParams: this.searchParams, cardId: this.cardId, hash: ''});
  }

  calculateExitLink(): void {
    this.branchLink = null;
    if (this.hasPoint()) {
      const pid = this.card?.point_id as string;
      if (this.searchParams?.ac_query) {
        this.branchLink = ['s', this.searchParams.ac_query, 'p', pid];
      } else {
        this.branchLink = ['p', pid];
      }
    }
  }

  hasPoint(): boolean {
    return !!this.card?.point_id && this.card?.point_id !== 'national_service';
  }

  ngAfterViewInit(): void {
    this.platform.browser(() => {
      fromEvent<TouchEvent>(this.content.nativeElement, 'touchstart')
      .pipe(
        untilDestroyed(this),
        swipe(this.content.nativeElement)
      ).subscribe((diff) => {
        if (Math.abs(diff) > 0.1 * document.body.clientHeight) {
          if (diff > 0) {
            console.log('down swipe', this.branchLink);
            if (this.branchLink) {
              this.router.navigate(this.branchLink, {relativeTo: this.route, queryParamsHandling: 'preserve'});
            }
          }
        }
      });
      const size = window.innerHeight - 100;
      this.size.emit(size);
    });
  }

  get landingPage(): boolean {
    return !this.searchParams?.original_query;
  }

  get inaccurate(): boolean {
    return !this.card?.branch_location_accurate && !this.nationalService;
  }

  get nationalService(): boolean {
    return !!this.card?.national_service;
  }

  navigateBack(): void {
    this.router.navigate(['../../'], {relativeTo: this.route, queryParamsHandling: 'preserve'});
  }

}
