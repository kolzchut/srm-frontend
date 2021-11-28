import { Injectable } from '@angular/core';
import { WindowService } from './window.service';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {

  constructor(private window: WindowService) {
    // console.log('LAYOUT', this.mobile, this.desktop);
  }

  get mobile() {
    return (this.window._?.innerWidth || 0) < 768;
  }

  get desktop() {
    return (this.window._?.innerWidth || 0) >= 768;
  }

}
