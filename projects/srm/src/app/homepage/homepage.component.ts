import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { Preset, TaxonomyItem, prepareQuery } from '../consts';
import { PlatformService } from '../platform.service';
import { SearchConfig } from '../search/search-config';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { timer } from 'rxjs';
import { LayoutService } from '../layout.service';
import { SearchService } from '../search.service';

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
  emergencies: Preset[];

  constructor(private api: ApiService, private platform: PlatformService, private router: Router, private layout: LayoutService, private searchSvc: SearchService) {
    this.searchConfig = new SearchConfig(this, this.router, this.api, this.platform, this.searchSvc);
    this.searchConfig.autoFocus = false;
    this.api.getExamples().subscribe((examples) => {
      this.examples = examples;
    });
    this.api.getEmergencies().subscribe((emergencies) => {
      this.emergencies = emergencies;
    });
  }

  updateFocus(focus: boolean) {
    if (focus) {
      this.searching = true;
    } else {
      timer(100).subscribe(() => {
        this.searchConfig.query_ = '';
        this.searching = false;
        this.searchConfig.blur();
      });
    }
  }

  startSearch(query: string, direct=false) {
    if (direct) {
      this.router.navigate(['/s', prepareQuery(query)]);
    } else {
      if (this.layout.desktop()) {
        this.searching = true;
        this.searchConfig.query_ = query;
        this.searchConfig.queries.next(query);
        this.searchConfig.focus();  
      } else {
        this.searchSvc.search(query);
      }  
    }
  }

  keydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.updateFocus(false);
    }
  }
}
