import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { debounceTime, first, from, Subject, switchMap, tap } from 'rxjs';
import { ApiService } from '../api.service';
import { Card, SearchParams } from '../consts';
import { PlatformService } from '../platform.service';

@Component({
  selector: 'app-landing-page-overlay',
  templateUrl: './landing-page-overlay.component.html',
  styleUrls: ['./landing-page-overlay.component.less']
})
export class LandingPageOverlayComponent implements OnChanges {

  @Input() searchParams: SearchParams;
  @Input() cardId: string;
  @Input() visibleCount = 0;
  @Output() open = new EventEmitter<boolean>();

  ready = new Subject<void>();
  
  totalServices: number = 0;
  card = new Card();
  opened = false;

  constructor(private api: ApiService, private platform: PlatformService) {
    if (!this.checkNeeded()) {
      this.open.emit(false);
    }
    api.getTotalServices().subscribe((total) => {
      this.totalServices = total;
    });
    this.platform.browser(() => {
      this.ready.pipe(
        debounceTime(1500),
        switchMap(() => {
          if (this.cardId) {
            return this.api.getCard(this.cardId).pipe(
              tap((card) => {
                this.card = card;
              })
            );
          } else {
            return from([true]);
          }
        }),
        first(),
      ).subscribe(() => {
        this.open.emit(true);
        this.opened = true;
      });
    });
  }

  ngOnChanges(): void {
    if (!this.opened) {
      this.ready.next();
    } else {
      this.open.emit(false);
    }
  }

  checkNeeded(): boolean {
    return true;
  }
}
