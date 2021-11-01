import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {

  constructor() { }

  get mobile() {
    return window.innerWidth < 768;
  }

  get desktop() {
    return window.innerWidth >= 768;
  }

}
