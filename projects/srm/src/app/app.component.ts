import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { environment } from '../environments/environment';
import { AnalyticsService } from './analytics.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {

  constructor(private analytics: AnalyticsService, private router: Router) {
    if (environment.gaTag) {
      this.router.events.subscribe(event => {
        if(event instanceof NavigationEnd){
          gtag('config', environment.gaTag, {
            'page_path': event.urlAfterRedirects
          });
        }
      });
    }
  }
}
