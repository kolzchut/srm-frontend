import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { SeoSocialShareService } from 'ngx-seo';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs';
import { environment } from '../environments/environment';
import { PlatformService } from './platform.service';

declare const window: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {

  constructor(
      // private analytics: AnalyticsService, 
      private router: Router,
      private platform: PlatformService, 
      private seo: SeoSocialShareService) {
    platform.browser(() => {
      if (environment.gaTag) {
        this.router.events.pipe(
          filter((event) => event instanceof NavigationEnd),
          map((event) => (event as NavigationEnd).urlAfterRedirects),
          map((urlAfterRedirects) => this.cleanUrl(urlAfterRedirects)),
          distinctUntilChanged()
        ).subscribe((urlAfterRedirects) => {
          platform.browser(() => {
            console.log('PAGE VIEW', urlAfterRedirects);
            window.gtag && window.gtag({
              event: 'page_view',
              page_path: urlAfterRedirects
            });
          })
        });
      }
    });
    this.seo.setData({
      title: 'כל שירות',
      description: 'כל שירות - מפת מענים חברתיים המסופקים על ידי הממשלה, עמותות וחברות',
      image: environment.externalUrl + '/assets/img/social-temp.png',
      // imageAuxData: {mimeType: 'image/png', width: 58, height: 36},
      url: 'https://www.kolsherut.org.il/',
      type: 'website',
      author: 'כל זכות',
    });
  }

  cleanUrl(url: string) {
    const parsed = new URL(url, window.location.href);
    if (parsed.pathname === '/q') {
      parsed.searchParams.delete('q');
    }
    parsed.searchParams.delete('li');
    parsed.hash = '';
    const ret = parsed.toString().slice(window.location.origin.length);
    return ret;
  }
}
