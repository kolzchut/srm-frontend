import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { debounceTime, distinctUntilChanged, first, from, Subject, switchMap, take, tap } from 'rxjs';
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

  ready = new Subject<string>();
  
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
        distinctUntilChanged(),
        debounceTime(1000),
        switchMap((token) => {
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
        take(2),
      ).subscribe(() => {
        this.opened = !this.opened;
        this.open.emit(this.opened);
      });
    });
  }

  ngOnChanges(): void {
    this.ready.next('' + this.searchParams?.searchHash + this.cardId);
  }

  checkNeeded(): boolean {
    return true;
  }
}
