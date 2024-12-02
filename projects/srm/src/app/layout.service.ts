import { effect, Injectable, OnDestroy, signal } from '@angular/core';
import { WindowService } from './window.service';
import { fromEvent, Subject, takeUntil, throttleTime } from 'rxjs';
import { PlatformService } from './platform.service';

@Injectable({
  providedIn: 'root'
})
export class LayoutService implements OnDestroy {

  private destroy$ = new Subject<void>();
  private readonly MOBILE_THRESHOLD = 1000;

  mobile = signal(false);
  desktop = signal(true);

  constructor(private window: WindowService, private ps: PlatformService) {
    this.ps.browser(() => {
      if (this.window._) {
        fromEvent(this.window._, 'resize')
          .pipe(throttleTime(200), takeUntil(this.destroy$))
          .subscribe(() => this._check());
      }
      this._check();
    });
  }

  private _check() {
    const innerWidth = this.window._?.innerWidth ?? 0;
    const isMobile = innerWidth < this.MOBILE_THRESHOLD;
    this.mobile.set(isMobile);
    this.desktop.set(!isMobile);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
