import { state, style, trigger, transition, animate, query } from '@angular/animations';
import { Location } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
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
        query('.content', [
          style({ transform: 'translateY(100%)' }),
          animate(
            300, style({ transform: 'translateY(0%)' })
          )
        ]),
        query('.map-window, .controls', [
          style({ opacity: 0 }),
          animate(
            600, style({ opacity: 1 })
          )
        ]),
      ]),
      transition(":leave", [
        query('.map-window, .controls', [
          style({ opacity: 0 }),
        ]),
        query('.content', [
          style({ transform: 'translateY(0%)' }),
          animate(
            300, style({ transform: 'translateY(100%)' })
          )
        ])
      ])      
    ])
  ]
})
export class CardContainerComponent implements OnInit, OnChanges {

  @Input() cardId = '';
  @Input() stage = '';
  @Input() searchParams: SearchParams;
  @Output() center = new EventEmitter<LngLatLike>();
  @Output() size = new EventEmitter<number>();
  @ViewChild('content') content: ElementRef;
  @ViewChild('scrolled') scrolled: ElementRef;
  @ViewChild('mapWindow') mapWindow: ElementRef;

  actionsBottom = -56;
  branchLink: string[] | null = null;

  sub: Subscription | null = null;
  card: Card | null = null;
  
  parametersQueue = new ReplaySubject<AuxParams>(1);
  
  MWM = MapWindowMode;

  constructor(private api: ApiService, public location: Location, private router: Router, private route: ActivatedRoute,
              private el: ElementRef, private seo: SeoSocialShareService, private platform: PlatformService) { }

  ngOnInit(): void {
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
    ).subscribe(({p, card}) => {
      this.card = card;
      if (this.card?.branch_geometry) {
        const geom: [number, number] = this.card.branch_geometry;        
        this.center.emit(geom);
      }
      if (this.card) {
        this.seo.setTitle(`כל שירות -  ${this.card.service_name}`);
      }
      this.seo.setUrl(window.location.href);
      this.calculateExitLink();
    });
  }

  ngOnChanges(): void {
    this.parametersQueue.next({searchParams: this.searchParams, cardId: this.cardId, hash: ''});
  }

  calculateExitLink(): void {
    this.branchLink = null;
    if (this.hasPoint()) {
      const pid = this.card?.point_id as string;
      this.branchLink = ['p', pid];
    }
  }

  hasPoint(): boolean {
    return !!this.card?.point_id && this.card?.point_id !== 'national_service';
  }

  ngAfterViewInit(): void {
    this.sub = fromEvent(this.scrolled.nativeElement, 'scroll').subscribe((e: any) => {
      this.actionsBottom = -56 + Math.min(56,  e.target.scrollTop);
    });
    fromEvent<TouchEvent>(this.content.nativeElement, 'touchstart')
    .pipe(
      untilDestroyed(this),
      swipe(this.content.nativeElement)
    ).subscribe((diff) => {
      if (Math.abs(diff) > 0.1 * document.body.clientHeight) {
        if (diff > 0) {
          console.log('down swipe');
          if (this.stage === 'card' && this.branchLink) {
            this.router.navigate(this.branchLink, {relativeTo: this.route, queryParamsHandling: 'preserve'});
          }
        }
      }
    });
    const size = window.innerHeight - 100;
    this.size.emit(size);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.sub = null;
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
}
