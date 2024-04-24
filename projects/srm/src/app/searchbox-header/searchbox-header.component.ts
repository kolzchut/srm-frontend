import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { debounceTime, filter, Subject, switchMap, tap, throttleTime } from 'rxjs';
import { ApiService } from '../api.service';
import { SearchParams, TaxonomyItem } from '../consts';
import { LayoutService } from '../layout.service';
import { Location } from '@angular/common';
import { SearchService } from '../search.service';

@Component({
  selector: 'app-searchbox-header',
  templateUrl: './searchbox-header.component.html',
  styleUrls: ['./searchbox-header.component.less'],
  host: {
    '[class.homepage]' : 'homepage',
  }
})
export class SearchboxHeaderComponent implements OnChanges {

  @Input() query: string | null = null;
  @Input() placeholder: string | null = null;
  @Input() homepage = false;
  @Input() searchParams: SearchParams;

  responseDisplay: string | null = null;
  situationDisplay: string | null = null;
  orgDisplay: string | null = null;

  constructor(private api: ApiService, public layout: LayoutService, public location: Location, private searchSvc: SearchService) {
  }

  ngOnChanges(): void {
    if (this.searchParams?.response_name) {
      this.responseDisplay = this.searchParams.response_name;
    } else {
      this.responseDisplay = null;
    }
    if (this.searchParams?.situation_name) {
      this.situationDisplay = this.searchParams.situation_name;
    } else {
      this.situationDisplay = null;
    }
    this.orgDisplay = this.searchParams?.org_name || null;
  }

  search(query: string) {
    this.searchSvc.search(query);
  }
}
