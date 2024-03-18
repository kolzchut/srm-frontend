import { Component, ElementRef, Input, OnChanges, OnInit } from '@angular/core';
import { delay, tap, timer } from 'rxjs';
import { ApiService } from '../api.service';
import { Card, SearchParams } from '../consts';

@Component({
  selector: 'app-point-result-stack',
  templateUrl: './point-result-stack.component.html',
  styleUrls: ['./point-result-stack.component.less'],
  host: {
    '[class.multiple]': '(cards?.length || 0) + (hiddenCards?.length || 0)>1',
    '[class.ohsnap]': 'snapping',
  }
})
export class PointResultStackComponent implements OnChanges {

  @Input() searchParams: SearchParams;
  @Input() cards: Card[] = [];
  @Input() hiddenCards: Card[] = [];
  triggerClicked_ = false;
  hidden_ = false;
  snapping = true;

  branches: Card[][] = [];

  constructor(private api: ApiService, private el: ElementRef) { }

  ngOnChanges(): void {
    this.hidden_ = !this.triggerClicked_ && this.hiddenCards.length > 0;;      
  }

  routerLink(card: Card): string[] {
    if (this.searchParams?.ac_query) {
      return ['/s', this.searchParams.ac_query, 'c', card.card_id];
    } else {
      return ['/c', card.card_id];
    }
  }

  triggerClicked() {
    this.triggerClicked_ = true;
    this.snapping = false;
    timer(1).pipe(
      tap(() => this.hidden_ = false),
      delay(500),
    ).subscribe(() => {
      this.snapping = true;
      const el = this.el.nativeElement as HTMLDivElement;
      el.querySelectorAll('.card')[this.cards.length]?.scrollIntoView({behavior: 'smooth'});
    });
  }

}
