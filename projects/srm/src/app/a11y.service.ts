import { Injectable } from '@angular/core';
import { SeoSocialShareService } from 'ngx-seo';
import { ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class A11yService {

  title = new ReplaySubject<string>(1);
  
  constructor(private seo: SeoSocialShareService) {}

  setTitle(title: string) {
    this.title.next(title);
  }

  setSeoTitle(title: string) {
    this.seo.setTitle(title);
    this.setTitle(title);
  }
}
