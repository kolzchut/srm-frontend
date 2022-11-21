import { Location } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SeoSocialShareService } from 'ngx-seo';
import { EMPTY, forkJoin, from, fromEvent, Observable, ReplaySubject, Subject, Subscription, timer } from 'rxjs';
import { distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { Card, SearchParams } from '../consts';


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
  }
})
export class BranchContainerComponent implements OnInit, OnChanges {

  @Input() cardId = '';
  @Input() pointId = '';
  @Input() stage = '';
  @Input() searchParams: SearchParams;
  @Output() size = new EventEmitter<number>();
  @ViewChild('content') content: ElementRef;

  actionsBottom = -56;
  exitLink: string[] | null = null;

  sub: Subscription | null = null;

  branches: BranchCards[] = [];
  cardBranch: BranchCards | null = null;
  card: Card | null = null;

  parametersQueue = new ReplaySubject<AuxParams>(1);

  constructor(private api: ApiService, public location: Location, private el: ElementRef, private seo: SeoSocialShareService) { }

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
        console.log('GET POINT', ret.p.searchParams);
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
        console.log('CARDS', branch.cards[0].branch_id, cards.filter(c => c.branch_id === branch.cards[0].branch_id));
        console.log('ALL CARDS', allCards.filter(c => c.branch_id === branch.cards[0].branch_id));
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
  }


  calculateExitLink(): void {
    if (this.stage === 'point') {
      this.exitLink = ['../..'];
    } else if (this.stage === 'card' && this.card?.point_id) {
      this.exitLink = ['p', this.card.point_id];
    }
  }

  ngAfterViewInit(): void {
    this.sub = fromEvent(this.el.nativeElement, 'scroll').subscribe((e: any) => {
      this.actionsBottom = -56 + Math.min(56,  e.target.scrollTop);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.sub = null;
  }

}
