import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { Preset, TaxonomyItem } from '../consts';
import { PlatformService } from '../platform.service';
import { SearchConfig } from '../search/search-config';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { timer } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.less'],
  host: {
    'tabIndex': 'null',
  }
})
export class HomepageComponent {

  public searchConfig: SearchConfig;
  searching = false;
  examples: Preset[];

  constructor(private api: ApiService, private platform: PlatformService, private router: Router) {
    this.searchConfig = new SearchConfig(this, this.router, this.api, this.platform);
    this.searchConfig.autoFocus = false;
    this.api.getExamples().subscribe((examples) => {
      this.examples = examples;
    });
  }

  updateFocus(focus: boolean) {
    if (focus) {
      this.searching = true;
    } else {
      timer(100).subscribe(() => {
        this.searching = false;
      });
    }
  }

  startSearch(query: string) {
    this.searching = true;
    this.searchConfig.query_ = query;
    this.searchConfig.queries.next(query);
  }
}
