import { Injectable } from '@angular/core';
import { SeoSocialShareService } from 'ngx-seo';
import { Observable, ReplaySubject, delay } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class A11yService {

  private title_ = new ReplaySubject<string>(1);
  title: Observable<string> = this.title_.pipe(delay(0));
  
  constructor(private seo: SeoSocialShareService) {}

  setTitle(title: string) {
    this.title_.next(title);
  }

  setSeoTitle(title: string) {
    this.seo.setTitle(title);
    this.setTitle(title);
  }
}
