import { Injectable } from '@angular/core';
import { WindowService } from './window.service';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {

  constructor(private window: WindowService) {
  }

  get mobile() {
    return (this.window._?.innerWidth || 0) < 768;
  }

  get desktop() {
    return (this.window._?.innerWidth || 0) >= 768;
  }

}
