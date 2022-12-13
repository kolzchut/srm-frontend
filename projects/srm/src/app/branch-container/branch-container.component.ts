import { Location } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SeoSocialShareService } from 'ngx-seo';
import { EMPTY, forkJoin, from, fromEvent, Observable, ReplaySubject, Subject, Subscription, timer } from 'rxjs';
import { distinctUntilChanged, first, map, switchMap, tap, withLatestFrom, zipWith } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { Card, SearchParams } from '../consts';
import { PlatformService } from '../platform.service';


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
    '[class.bare-point]': '!searchParams?.ac_query && !cardId',
  }
})
export class BranchContainerComponent implements OnInit, OnChanges {

  @Input() cardId = '';
  @Input() pointId = '';
  @Input() stage = '';
  @Input() searchParams: SearchParams;
  @Output() size = new EventEmitter<number>();
  @Output() markerProps = new EventEmitter<any>();
  @ViewChild('content') content: ElementRef;

  actionsBottom = -56;
  headerLink: string[] | null = null;
  branchLink: string[] | null = null;

  sub: Subscription | null = null;

  branches: BranchCards[] = [];
  cardBranch: BranchCards | null = null;
  card: Card | null = null;
  visibleCard: Card | null = null;

  parametersQueue = new ReplaySubject<AuxParams>(1);
  obs: IntersectionObserver | null = null;

  constructor(private api: ApiService, public location: Location, private router: Router, private route: ActivatedRoute,
              private el: ElementRef, private seo: SeoSocialShareService, private platform: PlatformService) { }

  ngOnInit(): void {
    this.parametersQueue.pipe(
      untilDestroyed(this),
      tap((p) => {
        p.hash = p.searchParams?.searchHash + p.cardId + p.pointId;
      }),
      distinctUntilChanged((a, b) => a.hash === b.hash),
      switchMap((p) => {
        if (p.pointId) {
          return from([{p, pid: p.pointId}]);
        } else if (this.cardId.length) {
          return this.api.getCard(p.cardId).pipe(map(card => {
            console.log('CARD', p, card);
            return {p, pid: card.point_id};
          }));
        } else {
          this.card = new Card();
          this.cardBranch = {cards: [this.card], hidden: []};
          this.branches = [this.cardBranch];    
          return EMPTY;
        }
      }),
      switchMap((ret) => {
        // console.log('GET POINT', ret.p.searchParams);
        return forkJoin([
          this.api.getPoint(ret.pid, ret.p.searchParams),
          this.api.getPoint(ret.pid),
        ]).pipe(
          map(([cards, allCards]) => {
            return {cards, allCards, p: ret.p};
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
      this.seo.setUrl(window.location.href);
      this.calculateExitLink();
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
  }


  calculateExitLink(): void {
    this.branchLink = null;
    this.headerLink = null;
    if (this.stage === 'point') {
      this.headerLink = ['../..'];
    } else if (this.stage === 'card' && this.card?.point_id) {
      this.branchLink = ['p', this.card.point_id];
      this.headerLink = this.branchLink;
    }
  }

  ngAfterViewInit(): void {
    this.sub = fromEvent(this.el.nativeElement, 'scroll').subscribe((e: any) => {
      this.actionsBottom = -56 + Math.min(56,  e.target.scrollTop);
    });
    fromEvent<TouchEvent>(this.content.nativeElement, 'touchstart')
    .pipe(
      switchMap((e: TouchEvent) => {
        const contentTop = this.content.nativeElement?.getBoundingClientRect().top;
        const startY = e.changedTouches[0].clientY;
        if (startY > contentTop && startY < contentTop + 56) {
          const startTimestamp = e.timeStamp;
          console.log('GESTURE START', startY);
          return fromEvent<TouchEvent>(document, 'touchend').pipe(
            first(),
            map((e: TouchEvent) => {
              const endY = e.changedTouches[0].clientY;
              const endTimestamp = e.timeStamp;
              console.log('GESTURE END', endY);
              if (endTimestamp - startTimestamp < 500 && Math.abs(endY - startY) > 100) {
                return endY - startY;
              } else {
                return 0;
              }
            })
          );
        } else {
          return EMPTY;
        }
      })
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
    this.sub?.unsubscribe();
    this.sub = null;
    this.obs?.disconnect();
    this.obs = null;
  }

  get actionsCard(): Card | null{
    return this.visibleCard || this.card;
  }

  landingPage(): boolean {
    return !!this.searchParams?.original_query && !this.pointId;
  }
}
