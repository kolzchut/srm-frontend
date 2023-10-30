import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AnalyticsService } from '../analytics.service';
import { Card, SearchParams } from '../consts';

@Component({
  selector: 'app-card-action',
  templateUrl: './card-action.component.html',
  styleUrls: ['./card-action.component.less'],
  host: {
    '[class.fullwidth]': 'fullwidth'
  }
})
export class CardActionComponent implements OnInit {

  @Input() card: Card;
  @Input() kind: string;
  @Input() display: string;
  @Input() action: string;
  @Input() label: string;
  @Input() primary = false;
  @Input() fullwidth = false;
  @Input() compact = false;
  @Output() copied = new EventEmitter<void>();

  constructor(private analytics: AnalyticsService) { }

  ngOnInit(): void {
  }

  onclick() {
    if (this.action) {
      this.analytics.cardActionEvent(this.card, this.kind, this.action);
      // window.open(this.action, '_blank');
    }
  }

  doCopy() {
    if (this.action) {
      this.analytics.cardActionEvent(this.card, this.kind, this.action);
      navigator.clipboard.writeText(this.display);
      this.copied.emit();
    }
  }
}
