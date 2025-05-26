import { Location } from '@angular/common';
import { Component, ElementRef, Input, OnChanges,ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SeoSocialShareService } from 'ngx-seo';
import {fromEvent, timer } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { LayoutService } from '../layout.service';
import { PlatformService } from '../platform.service';
import { A11yService } from '../a11y.service';
import { SearchConfig } from './search-config';
import { SearchService } from '../search.service';


@UntilDestroy()
@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.less'],
})
export class SearchComponent implements OnChanges {

  @Input() query: string | null = null;

  @ViewChild('container') container: ElementRef;

  public searchConfig: SearchConfig;

  constructor(private api: ApiService, public location: Location, private route: ActivatedRoute, private router: Router,
      private platform: PlatformService, public layout: LayoutService, private seo: SeoSocialShareService, private a11y: A11yService,
      private searchSvc: SearchService) {
    this.searchConfig = new SearchConfig(this, this.router, this.api, this.platform, () => this.searchSvc.search(null));
  }

  ngOnChanges(): void {
    timer(0).subscribe(() => {
      this.searchConfig.query_ = this.query || '';
      this.searchConfig.queries.next(this.searchConfig.query_);
    });
  }

  ngAfterViewInit() {
    this.a11y.setSeoTitle('כל שירות | חיפוש שירותים ומענים חברתיים');
    if (this.layout.desktop()) {
      fromEvent<KeyboardEvent>(this.container.nativeElement, 'keydown').pipe(
        filter((event) => event.key === 'Escape'),
        untilDestroyed(this),
        take(1),
      ).subscribe(() => {
        this.closeSearch();
      });
    }
  }

  closeSearch() {
    this.searchSvc.search(null);
  }
}
