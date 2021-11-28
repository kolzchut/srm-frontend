import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WindowService {

  constructor(@Inject(DOCUMENT) private document: Document) { }

  get _(): Window | null {
    return (this.document && this.document.defaultView) ? this.document.defaultView : null;
  }
  get D(): Document {
    return this.document;
  }
}
