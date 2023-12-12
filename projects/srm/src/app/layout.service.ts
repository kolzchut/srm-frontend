import { Injectable } from '@angular/core';
import { WindowService } from './window.service';
import { fromEvent } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {

  mobile = false;
  desktop = true;

  constructor(private window: WindowService) {
    if (this.window._) {
      fromEvent(this.window._, 'resize').subscribe(() => {
        this._check();
      });
    }
    this._check();
  }

  private _check() {
    if (this.window._?.innerWidth) {
      this.mobile = this.window._.innerWidth < 768;
      this.desktop = this.window._.innerWidth >= 768;
    } else {
      this.mobile = false;
      this.desktop = true;
    }
  }

}
