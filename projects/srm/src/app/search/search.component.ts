import { Location } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SeoSocialShareService } from 'ngx-seo';
import { Subject, timer } from 'rxjs';
import { debounceTime, first, switchMap } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { prepareQuery, _h } from '../consts';
import { LayoutService } from '../layout.service';
import { PlatformService } from '../platform.service';
import { A11yService } from '../a11y.service';
import { SearchConfig } from './search-config';


@UntilDestroy()
@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.less'],
})
export class SearchComponent implements OnInit {

  public searchConfig: SearchConfig;

  constructor(private api: ApiService, public location: Location, private route: ActivatedRoute, private router: Router,
      private platform: PlatformService, public layout: LayoutService, private seo: SeoSocialShareService, private a11y: A11yService) {
    this.searchConfig = new SearchConfig(this, this.router, this.api, this.platform);
    this.searchConfig.queries.pipe(
      untilDestroyed(this),
    ).subscribe((query) => {
      this.router.navigate(['.'], {
        relativeTo: this.route,
        queryParams: {
          q: query
        },
        replaceUrl: true,
      });
    });
  }

  ngOnInit(): void {
    this.route.queryParams.pipe(
      first()
    ).subscribe(params => {
      timer(0).subscribe(() => {
        this.searchConfig.query_ = params.q || '';
        this.searchConfig.queries.next(this.searchConfig.query_);
      });
    });
  }

  ngAfterViewInit() {
    this.a11y.setSeoTitle('כל שירות | חיפוש שירותים ומענים חברתיים');
  }

  keydown(event: KeyboardEvent) {
    if (this.layout.desktop() && event.key === 'Escape') {
      this.location.back();
    }
  }
}
