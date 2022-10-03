import { Location } from '@angular/common';
import { Component, ElementRef, Input, OnChanges, OnInit } from '@angular/core';
import { from, fromEvent, Observable, Subscription } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { Card } from '../consts';

@Component({
  selector: 'app-branch-container',
  templateUrl: './branch-container.component.html',
  styleUrls: ['./branch-container.component.less'],
  host: {
    '[class.point-mode]': '!!pointId',
    '[class.card-mode]': '!!cardId',
  }
})
export class BranchContainerComponent implements OnChanges {

  @Input() cardId = '';
  @Input() pointId = '';
  @Input() stage = '';

  actionsBottom = -56;
  exitLink: string[] | null = null;

  sub: Subscription | null = null;

  branches: Card[][] = [];
  cardBranch: Card[] | null = null;
  card: Card | null = null;

  constructor(private api: ApiService, public location: Location, private el: ElementRef) { }

  ngOnChanges(): void {
    let pointObs: Observable<string> | null = null;
    if (this.pointId.length) {
      pointObs = from([this.pointId]);
    } else if (this.cardId.length) {
      pointObs = this.api.getCard(this.cardId).pipe(map(card => card.point_id));
    }
    if (pointObs) {
      pointObs.pipe(
        switchMap(point_id => {
          return this.api.getPoint({query: null, response: null, situation: null}, point_id)
        })
      ).subscribe((cards) => {
        cards = cards.sort((a, b) => a.branch_id.localeCompare(b.branch_id));
        this.branches = [];
        let branch: Card[] = [];
        for (const card of cards) {
          if (branch.length === 0 || branch[0].branch_id !== card.branch_id) {
            branch = [];
            this.branches.push(branch);
          }
          branch.push(card);
          if (card.card_id === this.cardId) {
            this.cardBranch = branch;
            this.card = card;
          }
        }
        this.calculateExitLink();
      });
    } else {
      this.card = new Card();
      this.cardBranch = [this.card];
      this.branches = [this.cardBranch];
    }
  }



  calculateExitLink(): void {
    if (this.card && this.pointId.length) {
      this.exitLink = null; //['/c', this.card.card_id];
    } else if (this.card) {
      this.exitLink = ['/c', this.card.card_id, 'p', this.card.point_id];
    } else if (this.pointId.length) {
      this.exitLink = null;
    } else {
      this.exitLink = null;
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
