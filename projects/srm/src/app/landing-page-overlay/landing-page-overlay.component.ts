import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { debounceTime, distinctUntilChanged, first, from, map, Subject, switchMap, take, tap } from 'rxjs';
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
  @Input() landingPage = false;
  @Output() open = new EventEmitter<boolean>();

  ready = new Subject<string>();
  
  totalServices: number = 0;
  card = new Card();
  opened = 0;
  stage_: string | null = null;
  needed: boolean | null = null;

  constructor(private api: ApiService, private platform: PlatformService) {
    api.getTotalServices().subscribe((total) => {
      this.totalServices = total;
    });
    this.platform.browser(() => {
      this.ready.pipe(
        distinctUntilChanged(),
        debounceTime(this.platform.browser() ? 3000 : 0),
        switchMap((token) => {
          if (this.cardId) {
            return this.api.getCard(this.cardId).pipe(
              tap((card) => {
                this.card = card;
              }),
              map(() => token)
            );
          } else {
            return from([token]);
          }
        }),
        take(2),
      ).subscribe((token) => {
        //console.log('ACTION LANDING PAGE COUNT', token, this.opened);
        if (!this.checkNeeded()) {
          //console.log('ACTION LANDING PAGE NOT NEEDED');
          this.open.emit(false);
          this.opened = 2;
        } else {
          //console.log('ACTION LANDING PAGE NEEDED');
          this.opened += 1;
          this.open.emit(this.opened === 1);  
        }    
      });
    });
  }

  ngOnChanges(): void {
    if (this.cardId || (this.searchParams && this.visibleCount > 0)) {
      this.ready.next('' + this.searchParams?.searchHash + this.cardId + this.visibleCount);
    }
  }

  checkNeeded(): boolean {
    //console.log('ACTION LANDING PAGE CHECK NEEDED', this.landingPage, this.needed);
    if (this.needed !== null) {
      return this.needed;
    }
    if (this.landingPage) {
      this.platform.browser(() => {
        let lastOpenedStr = window.localStorage.getItem('srm_landing_page');
        let lastOpened = 0;
        try {
          if (lastOpenedStr) {
            lastOpened = parseFloat(lastOpenedStr);
          }
        } catch {}
        const now = new Date().getTime();
        //console.log('ACTION LANDING PAGE CHECK NEEDED', lastOpened, now, now - lastOpened);
        window.localStorage.setItem('srm_landing_page', '' + now);
        if (now - lastOpened > 1000 * 60 * 60 * 24 * 90) {
          this.needed = true;
        }
      });
    }
    this.needed = !!this.needed;
    return this.needed;
  }

  close(): void {
    //console.log('ACTION LANDING PAGE CLOSING');
    this.needed = false;
    this.open.emit(false);
  }
}
