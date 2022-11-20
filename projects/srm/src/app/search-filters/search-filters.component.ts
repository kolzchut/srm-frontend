import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject } from 'rxjs';
import { delay, switchMap, takeUntil } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { DistinctItem, SearchParams, TaxonomyItem } from '../consts';

@UntilDestroy()
@Component({
  selector: 'app-search-filters',
  templateUrl: './search-filters.component.html',
  styleUrls: ['./search-filters.component.less'],
  host: {
    '[class.active]' : 'active',
  }
})
export class SearchFiltersComponent implements OnInit {

  @Input() searchParams: SearchParams;
  @Output() params = new EventEmitter<SearchParams>();
  @Output() activate = new EventEmitter<boolean>();

  active_ = false;
  situations: DistinctItem[] = [];
  responses: DistinctItem[] = [];
  audiences: TaxonomyItem[] = [];
  age_groups: TaxonomyItem[] = [];
  languages: TaxonomyItem[] = [];
  responseItems: TaxonomyItem[];
  situationsMap: any = {};
  responsesMap: any = {};

  currentSearchParams: SearchParams;
  resultCount = -1;

  internalSearchParams = new Subject<SearchParams>();
  
  constructor(private api: ApiService) {
    this.api.getSituations().subscribe((data: TaxonomyItem[]) => {
      this.situationsMap = {};
      data.forEach((item) => {
        if (item.id) {
          this.situationsMap[item.id] = item;
        }
      });
    });
    this.api.getResponses().subscribe((data: TaxonomyItem[]) => {
      this.responsesMap = {};
      data.forEach((item) => {
        if (item.id) {
          this.responsesMap[item.id] = item;
        }
      });
    });
    this.internalSearchParams.pipe(
      untilDestroyed(this),
      switchMap((params) => this.api.getCounts(params))
    ).subscribe((data) => {
      this.resultCount = data.search_counts.cards.total_overall;
    });
  }

  ngOnInit(): void {
    this.processSearchParams();
  }

  processSearchParams(): void {
    this.api.getDistinct(this.searchParams).subscribe((data) => {
      this.situations = data.situations;
      this.responses = data.responses;
      this.audiences = this.situations
        .filter(x => !!x && !!x.key)
        .filter(x => 
          x.key?.indexOf('human_situations:age_group') === -1 &&
          x.key?.indexOf('human_situations:language') === -1
        )
        .filter(x => x.key !== this.searchParams.situation)
        .map(x => this.situationsMap[x.key || ''])
        .filter(x => !!x);
      this.age_groups = this.situations
        .filter(x => !!x && !!x.key)
        .filter(x => 
          x.key?.indexOf('human_situations:age_group') === 0
        )
        .map(x => this.situationsMap[x.key || ''])
        .filter(x => !!x);
      if (this.age_groups.length > 1) {
        this.age_groups = ['infants', 'children', 'teens', 'young_adults', 'adults', 'seniors'].map(x => this.situationsMap['human_situations:age_group:' + x]);
      } else {
        this.age_groups = [];
      }

      this.languages = this.situations
        .filter(x => !!x && !!x.key)
        .filter(x => 
          x.key?.indexOf('human_situations:language') === 0
        )
        .filter(x => 
          x.key !== 'human_situations:language:hebrew_speaking'
        )
        .filter(x => x.key !== this.searchParams.situation)
        .map(x => this.situationsMap[x.key || ''])
        .filter(x => !!x);

      this.responseItems = this.responses
        .filter(x => x.key !== this.searchParams.response)
        .map(x => this.responsesMap[x.key || ''])
        .filter(x => !!x);
    });
    this.currentSearchParams = this.searchParams;
  }

  set active(value: boolean) {
    this.activate.emit(value);
    this.active_ = value;
    if (value) {
      this.processSearchParams();
      this.pushSearchParams();
    }
  }

  get active() {
    return this.active_;
  }

  get totalFilters(): number {
    return (this.currentSearchParams?.filter_responses?.length || 0) + 
           (this.currentSearchParams?.filter_situations?.length || 0) +
           (this.currentSearchParams?.filter_age_groups?.length || 0) +
           (this.currentSearchParams?.filter_languages?.length || 0)
    ;
  }

  _copySearchParams(sp: SearchParams): SearchParams {
    const ret = new SearchParams();
    Object.assign(ret, {
      query: sp.query,
      response: sp.response,
      situation: sp.situation,
      filter_situations: sp.filter_situations?.slice() || [],
      filter_age_groups: sp.filter_age_groups?.slice() || [],
      filter_languages: sp.filter_languages?.slice() || [],
      filter_responses: sp.filter_responses?.slice() || [],
    });
    return ret;
  }
  
  isResponseSelected(response: TaxonomyItem) {
    if (response.id && this.currentSearchParams?.filter_responses) {
      return this.currentSearchParams.filter_responses.indexOf(response.id) !== -1;
    } else {
      return false;
    }
  }

  onSituationChange(checked: boolean, item: TaxonomyItem, field: string) {
    const csp: any = this.currentSearchParams;
    let sits: string[] = csp[field] || [];
    sits = sits.filter(x => x !== item.id);
    if (checked && item.id) {
      sits.push(item.id);
    }
    csp[field] = sits;
    this.pushSearchParams();
  }

  toggleResponse(item: TaxonomyItem) {
    const checked = !this.isResponseSelected(item);
    this.currentSearchParams.filter_responses = this.currentSearchParams.filter_responses || [];
    this.currentSearchParams.filter_responses = this.currentSearchParams.filter_responses.filter(x => x !== item.id);
    if (checked && item.id) {
      this.currentSearchParams.filter_responses.push(item.id);
    }
    this.pushSearchParams();
  }

  fixSearchParams(sp: SearchParams) {
    if (sp.filter_age_groups?.length === this.age_groups.length) {
      sp.filter_age_groups = [];
    }
  }

  pushSearchParams() {
    const sp = this.currentSearchParams;
    this.currentSearchParams = this._copySearchParams(sp);
    this.fixSearchParams(sp);
    this.internalSearchParams.next(sp);
  }

  closeWithParams() {
    const sp = this._copySearchParams(this.currentSearchParams);
    this.fixSearchParams(sp);
    this.params.emit(sp);
    this.active = false;
  }
}