import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { debounceTime, filter, Subject, switchMap, tap, throttleTime } from 'rxjs';
import { ApiService } from '../api.service';
import { SearchParams, TaxonomyItem } from '../consts';
import { LayoutService } from '../layout.service';

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
  @Input() showCity = true;

  responseDisplay: string | null = null;
  situationDisplay: string | null = null;
  orgDisplay: string | null = null;
  didYouMean: string | null = null;
  didYouMeanLink: string | null = null;

  searchParamQueue = new Subject<SearchParams>();

  constructor(private api: ApiService, public layout: LayoutService) {
    this.searchParamQueue.pipe(
      debounceTime(500),
      filter((searchParams: SearchParams) => {
        console.log('DID YOU MEAN?', this.searchParams?.query, this.searchParams);
         const ret = !this.homepage && !!searchParams?.query && !searchParams?.filter_responses?.length && !searchParams?.filter_situations?.length;
         if (!ret) {
          this.didYouMean = null;
         }
         return ret;
      }),
      switchMap((searchParams: SearchParams) => {
        return this.api.didYouMean(searchParams);
      })
    ).subscribe((didYouMean: string | null) => {
        this.didYouMean = didYouMean;
        if (didYouMean) {
          this.didYouMeanLink = didYouMean.split(' ').join('_');
        }
        console.log('DID YOU MEAN', didYouMean);
    });
  }

  ngOnChanges(): void {
    this.searchParamQueue.next(this.searchParams);
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

}
