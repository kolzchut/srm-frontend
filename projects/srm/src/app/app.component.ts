import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { SeoSocialShareService } from 'ngx-seo';
import { environment } from '../environments/environment';
import { AnalyticsService } from './analytics.service';
import { PlatformService } from './platform.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {

  constructor(private analytics: AnalyticsService, private router: Router, private platform: PlatformService, private seo: SeoSocialShareService) {
    if (environment.gaTag) {
      this.router.events.subscribe(event => {
        if(event instanceof NavigationEnd) {
          platform.browser(() => {
            console.log('PAGE VIEW', event.urlAfterRedirects);
            window.gtag && gtag('config', environment.gaTag, {
              'page_path': event.urlAfterRedirects
            });  
          })
        }
      });
    }
    this.seo.setData({
      title: 'כל שירות',
      description: 'מפת המענים החברתיים',
      image: 'https://www.kolsherut.org.il/assets/img/logo.png',
      imageAuxData: {mimeType: 'image/svg+xml', width: 58, height: 36},
      url: 'https://www.kolsherut.org.il/',
      type: 'website',
      author: 'כל זכות',
    });
  }
}
