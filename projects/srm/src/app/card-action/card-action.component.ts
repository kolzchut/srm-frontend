import { Component, Input, OnInit } from '@angular/core';
import { AnalyticsService } from '../analytics.service';
import { Card, SearchParams } from '../consts';

@Component({
  selector: 'app-card-action',
  templateUrl: './card-action.component.html',
  styleUrls: ['./card-action.component.less']
})
export class CardActionComponent implements OnInit {

  @Input() card: Card;
  @Input() kind: string;
  @Input() display: string;
  @Input() action: string;
  @Input() label: string;
  @Input() primary = false;
  @Input() compact = false;
  
  constructor(private analytics: AnalyticsService) { }

  ngOnInit(): void {
  }

  onclick() {
    if (this.action) {
      this.analytics.cardActionEvent(this.card, this.kind, this.action);
      // window.open(this.action, '_blank');
    }
  }
}
