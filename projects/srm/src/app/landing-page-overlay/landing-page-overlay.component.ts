import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ApiService } from '../api.service';
import { Card, SearchParams } from '../consts';

@Component({
  selector: 'app-landing-page-overlay',
  templateUrl: './landing-page-overlay.component.html',
  styleUrls: ['./landing-page-overlay.component.less']
})
export class LandingPageOverlayComponent implements OnInit {

  @Input() searchParams: SearchParams;
  @Input() cardId: string;
  @Input() visibleCount = 0;
  @Output() closed = new EventEmitter<void>();
  
  totalServices: number = 0;
  card = new Card();

  constructor(private api: ApiService) {
    if (!this.checkNeeded()) {
      this.closed.emit();
    }
    api.getTotalServices().subscribe((total) => {
      this.totalServices = total;
    });
  }

  ngOnInit(): void {
    if (this.cardId) {
      this.api.getCard(this.cardId).subscribe((card) => {
        this.card = card;
      });
    }
  }

  checkNeeded(): boolean {
    return true;
  }
}
