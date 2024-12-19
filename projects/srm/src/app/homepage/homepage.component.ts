import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { ApiService } from '../api.service';
import { PlatformService } from '../platform.service';
import { SearchConfig } from '../search/search-config';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { timer } from 'rxjs';
import { LayoutService } from '../layout.service';
import { SearchService } from '../search.service';
import { AnalyticsService } from '../analytics.service';

@UntilDestroy()
@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.less'],
  host: {
    'tabIndex': 'null',
  }
})
export class HomepageComponent implements AfterViewInit{

  public searchConfig: SearchConfig;
  public layout: LayoutService;
  
  @ViewChild('search') search: ElementRef;
  @ViewChild('homepageGroups') homepageGroups: ElementRef;
  searchVisibleObserver: IntersectionObserver;
  searchVisible = true;
  
  constructor(private api: ApiService, private platform: PlatformService, private router: Router, public layoutService: LayoutService, private searchSvc: SearchService, private analytics: AnalyticsService) {
    this.searchConfig = new SearchConfig(this, this.router, this.api, this.platform, () => {});
    this.searchConfig.autoFocus = false;
    this.layout = layoutService;
  }

  ngAfterViewInit(): void {
    this.platform.browser(() => {
      const options: any = { threshold: [0.1], rootMargin: '-80px'};
      if (this.layout.mobile()) {
        options.rootMargin = '-20px';
      }
      this.searchVisibleObserver = new IntersectionObserver((entries) => {
        if (entries.length === 1) {
          this.searchVisible = entries[0].intersectionRatio > 0.1;
        }
      }, options);
      this.searchVisibleObserver.observe(this.search.nativeElement);
    });
  }

  updateFocus(focus: boolean) {
    if (focus) {
      this.search.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } else {
      timer(100).subscribe(() => {
        this.searchConfig.query_ = '';
        this.searchConfig.blur();
      });
    }
  }

  startSearch(query: string, forceSvc=false) {
    if (this.layout.desktop() && !forceSvc) {
      this.searchConfig.query_ = query;
      this.searchConfig.queries.next(query);
      this.searchConfig.focus();
    } else {
      this.analytics.interactionEvent('homepage-searchbar', 'homepage');
      this.searchSvc.search(query);
    }  
  }

  keydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.updateFocus(false);
    }
  }
}
