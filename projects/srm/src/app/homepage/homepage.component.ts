import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../api.service';
import { HomepageEntry, Preset, TaxonomyItem, prepareQuery } from '../consts';
import { PlatformService } from '../platform.service';
import { SearchConfig } from '../search/search-config';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { fromEvent, timer } from 'rxjs';
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
  groups: {
    title: string,
    query: string,
    group_link: string,
    items: HomepageEntry[]
  }[] = [];

  @ViewChild('search') search: ElementRef;
  @ViewChild('homepageGroups') homepageGroups: ElementRef;
  searchVisibleObserver: IntersectionObserver;
  searchVisible = true;
  
  constructor(private api: ApiService, private platform: PlatformService, private router: Router, private layout: LayoutService, private searchSvc: SearchService, private analytics: AnalyticsService) {
    this.searchConfig = new SearchConfig(this, this.router, this.api, this.platform, () => {});
    this.searchConfig.autoFocus = false;
    api.getHomepage().subscribe((homepage) => {
      const groups: any = [];
      homepage.forEach((entry: HomepageEntry) => {
        if (!entry.title && !groups[entry.group]) {
          const entries: HomepageEntry[] = [];
          groups[entry.group] = entries;
          this.groups.push({ title: entry.group, query: entry.query, group_link: entry.group_link, items: entries});
        }
      });
      homepage.forEach((entry: HomepageEntry) => {
        if (!!entry.title && groups[entry.group]) {
          groups[entry.group].push(entry);
        }
      });
      this.resizeGroupItems();
    });
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
      this.resizeGroupItems();
      fromEvent(window, 'resize').pipe(
        untilDestroyed(this),
      ).subscribe(() => {
        console.log('RESIZE');
        this.resizeGroupItems();
      });
    });
  }

  resizeGroupItems() {
    timer(0).subscribe(() => {
      const el = this.homepageGroups.nativeElement as HTMLElement;
      const items = el.querySelectorAll('.homepage-group') as NodeListOf<HTMLElement>;
      items.forEach((item: HTMLElement) => {
        const rowHeight = parseInt(getComputedStyle(el).getPropertyValue('grid-auto-rows'));
        const rowGap = parseInt(getComputedStyle(el).getPropertyValue('grid-row-gap'));
        const rowSpan = Math.ceil((item.getBoundingClientRect().height + rowGap)/(rowHeight + rowGap));
        item.style.gridRowEnd = 'span ' + rowSpan;
      });
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
