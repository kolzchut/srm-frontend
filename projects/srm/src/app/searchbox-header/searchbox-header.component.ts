import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { SearchParams, TaxonomyItem } from '../consts';

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
  didYouMean: string | null = null;
  didYouMeanLink: string | null = null;

  constructor(private api: ApiService) { }

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
    if (this.searchParams?.query) {
      this.api.didYouMean(this.searchParams).subscribe((didYouMean: string | null) => {
        this.didYouMean = didYouMean;
        if (didYouMean) {
          this.didYouMeanLink = didYouMean.split(' ').join('_');
        }
        console.log('DID YOU MEAN', didYouMean);
      });
    } else {
      this.didYouMean = null;
    }
    console.log('DID YOU MEAN?', this.searchParams);
  }

}
