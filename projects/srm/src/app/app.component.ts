import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { SeoSocialShareService } from 'ngx-seo';
import { debounceTime, filter } from 'rxjs';
import { environment } from '../environments/environment';
import { AnalyticsService } from './analytics.service';
import { PlatformService } from './platform.service';

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
          debounceTime(250)
        ).subscribe((event_) => {
          platform.browser(() => {
            const event = event_ as NavigationEnd;
            console.log('PAGE VIEW', event.urlAfterRedirects);
            window.gtag && gtag('config', environment.gaTag, {
              'page_path': event.urlAfterRedirects
            });  
          })
        });
      }
    });
    this.seo.setData({
      title: 'כל שירות',
      description: 'כל שירות - מפת מענים חברתיים המסופקים על ידי הממשלה, עמותות וחברות',
      image: '/assets/img/social.png',
      // imageAuxData: {mimeType: 'image/png', width: 58, height: 36},
      url: 'https://www.kolsherut.org.il/',
      type: 'website',
      author: 'כל זכות',
    });
  }
}
