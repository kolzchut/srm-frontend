import { Location } from '@angular/common';
import { Component, ElementRef, Input, OnChanges, OnInit } from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { ApiService } from '../api.service';
import { Card } from '../consts';

@Component({
  selector: 'app-branch-container',
  templateUrl: './branch-container.component.html',
  styleUrls: ['./branch-container.component.less']
})
export class BranchContainerComponent implements OnInit, OnChanges {

  @Input() cardId = '';
  @Input() pointId = '';
  card: any = {};
  actionsBottom = -56;

  sub: Subscription | null = null;

  constructor(private api: ApiService, public location: Location, private el: ElementRef) { }

  ngOnInit(): void {
  }

  ngOnChanges(): void {
    if (this.cardId.length) {
      this.api.getCard(this.cardId).subscribe(card => {
        console.log('CARD', card);
        this.card = card;
      });
    } else {
      this.card = {};
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
