import { Injectable, signal } from '@angular/core';
import { WindowService } from './window.service';
import { fromEvent, timer } from 'rxjs';
import { PlatformService } from './platform.service';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {

  mobile = signal(false);
  desktop = signal(true);

  constructor(private window: WindowService, private ps: PlatformService) {
    this.ps.browser(() => {
      if (this.window._) {
        fromEvent(this.window._, 'resize').subscribe(() => {
          this._check();
        });
      }
      this._check();
      timer(100).subscribe(() => {
        this._check();
      });
    });
  }

  private _check() {
    if (this.window._?.innerWidth) {
      this.mobile.set(this.window._.innerWidth < 1000);
      this.desktop.set(!this.mobile());
    } else {
      this.mobile.set(false);
      this.desktop.set(true);
    }
  }

}
