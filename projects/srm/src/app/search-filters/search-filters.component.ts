import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ReplaySubject, Subject, forkJoin, fromEvent, merge } from 'rxjs';
import { filter, distinctUntilChanged, switchMap, takeUntil, tap, debounceTime, first } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { DistinctItem, QueryCardResult, SearchParams, SITUATION_FILTERS, TaxonomyItem, ViewPort } from '../consts';
import { SearchFiltersMoreButtonComponent } from '../search-filters-more-button/search-filters-more-button.component';
import { PlatformService } from '../platform.service';
import { AreaSearchState } from '../area-search-selector/area-search-state';

@UntilDestroy()
@Component({
  selector: 'app-search-filters',
  templateUrl: './search-filters.component.html',
  styleUrls: ['./search-filters.component.less'],
  host: {
    '[class.active]' : 'active',
  }
})
export class SearchFiltersComponent implements OnChanges {

  NUM_RESPONSES = 8;
  
  @Input() searchParams: SearchParams;
  @Output() params = new EventEmitter<SearchParams>();
  @Output() activate = new EventEmitter<boolean>();
  @Output() zoomout = new EventEmitter<ViewPort>();

  @ViewChild('moreResponses') moreResponses: SearchFiltersMoreButtonComponent;

  active_ = false;
  situations: DistinctItem[] = [];
  responses: DistinctItem[] = [];
  categories: DistinctItem[] = [];
  audiences: TaxonomyItem[] = [];
  health_issues: TaxonomyItem[] = [];
  age_groups: TaxonomyItem[] = [];
  languages: TaxonomyItem[] = [];
  others: {
    [key: string]: TaxonomyItem[]
  } = {};
  responseItems: TaxonomyItem[];
  responseCategoryItems: TaxonomyItem[];
  situationsMap: any = {};
  responsesMap: any = {};

  currentSearchParams: SearchParams;
  resultCount = -1;
  resultCountBounded = -1;

  incomingSearchParams = new Subject<SearchParams>();
  internalSearchParams = new Subject<SearchParams>();
  
  ready = new ReplaySubject<boolean>(1);

  showDiscovery: boolean | null = null;
  areaSearchState: AreaSearchState;

  constructor(private api: ApiService, private platform: PlatformService) {
    forkJoin([this.api.getSituations(), this.api.getResponses()])
    .subscribe(([situationData, responseData]) => {
      this.situationsMap = {};
      situationData.forEach((item) => {
        if (item.id) {
          this.situationsMap[item.id] = item;
        }
      });
      this.responsesMap = {};
      responseData.forEach((item) => {
        if (item.id) {
          this.responsesMap[item.id] = item;
        }
      });
      this.ready.next(true);
    })
    this.internalSearchParams.pipe(
      untilDestroyed(this),
      // distinctUntilChanged((a, b) => a.searchHash.localeCompare(b.searchHash) === 0),
      tap((params) => {
        this.params.emit(this._copySearchParams(params));
      }),
      switchMap((params) => forkJoin([
        this.api.getCounts(params),
        this.api.getCounts(params, true),
      ]))
    ).subscribe(([data, dataBounded]) => {
      this.resultCount = data.search_counts.cards.total_overall;
      this.resultCountBounded = dataBounded.search_counts.cards.total_overall;
      this.areaSearchState.viewport = data.viewport;
    });
    this.incomingSearchParams.pipe(
      untilDestroyed(this),
      filter((params) => !!params),
      distinctUntilChanged((a, b) => a.searchHash.localeCompare(b.searchHash) === 0),
    ).subscribe((params) => {
      this.processSearchParams(params);
    });
    this.incomingSearchParams.pipe(
      untilDestroyed(this),
      filter((params) => !!params),
      distinctUntilChanged((a, b) => a.bounds === b.bounds),
    ).subscribe((params) => {
      this.currentSearchParams.bounds = params.bounds;
      this.pushSearchParams();
    });
    this.incomingSearchParams.pipe(
      untilDestroyed(this),
      filter((params) => !!params),
      filter((params) => !params.hasFilters),
      debounceTime(this.platform.browser() ? 3000 : 0),
      switchMap((params) => this.api.getDistinct(params, true)),
    ).subscribe((result) => {
      this.checkDiscoveryNeeded(result);
    });
    this.areaSearchState = new AreaSearchState(api);
    this.areaSearchState.bounds.subscribe((bounds) => {
      this.zoomout.next(bounds);
    });
  }

  ngOnChanges(): void {
    this.incomingSearchParams.next(this.searchParams);
  }

  processSearchParams(params: SearchParams): void {
    if (params) {
      this.ready.pipe(
        switchMap(() => this.api.getDistinct(params)),
        tap((data) => {
          if (this.active_) {
            this.situations = data.situations;
            this.responses = this.sortResponses(data.responses, data.categories);
            this.audiences = this.situations
              .filter(x => !!x && !!x.key)
              .filter(x => 
                x.key?.indexOf('human_situations:armed_forces') === 0 ||
                x.key?.indexOf('human_situations:citizenship') === 0 ||
                x.key?.indexOf('human_situations:criminal_history') === 0 ||
                x.key?.indexOf('human_situations:deprivation') === 0 ||
                x.key?.indexOf('human_situations:education') === 0 ||
                x.key?.indexOf('human_situations:household') === 0 ||
                x.key?.indexOf('human_situations:housing') === 0 ||
                x.key?.indexOf('human_situations:income') === 0 ||
                x.key?.indexOf('human_situations:sectors') === 0 ||
                x.key?.indexOf('human_situations:sexuality') === 0 ||
                x.key?.indexOf('human_situations:survivors') === 0 ||
                false
              )
              .filter(x => x.key !== params.situation)
              .map(x => this.situationsMap[x.key || ''])
              .filter(x => !!x);
            this.health_issues = this.situations
              .filter(x => !!x && !!x.key)
              .filter(x => 
                x.key?.indexOf('human_situations:mental_health') === 0 ||
                x.key?.indexOf('human_situations:substance_dependency') === 0 ||
                x.key?.indexOf('human_situations:disability') === 0 ||
                x.key?.indexOf('human_situations:health') === 0 ||
                false
              )
              .filter(x => x.key !== params.situation)
              .map(x => this.situationsMap[x.key || ''])
              .filter(x => !!x);
            
            this.age_groups = ['infants', 'children', 'teens', 'young_adults', 'adults', 'seniors']
                .map(x => 'human_situations:age_group:' + x)
                .filter(x => this.situations.map(y => y.key).indexOf(x) >= 0)
                .map(x => this.situationsMap[x])
                .filter(x => !!x);

            this.languages = this.situations
              .filter(x => !!x && !!x.key)
              .filter(x => 
                x.key?.indexOf('human_situations:language') === 0
              )
              .filter(x => 
                x.key !== 'human_situations:language:hebrew_speaking'
              )
              .filter(x => x.key !== params.situation)
              .map(x => this.situationsMap[x.key || ''])
              .filter(x => !!x);

            this.others = {};
            for (const hsroot of ['employment', 'benefit_holders', 'life_events', 'urgency', 'gender', 'community', 'role']) {
              this.others[hsroot] = this.situations
                .filter(x => !!x && !!x.key)
                .filter(x => x.key?.indexOf('human_situations:' + hsroot) === 0)
                .filter(x => x.key !== params.situation)
                .map(x => this.situationsMap[x.key || ''])
                .filter(x => !!x);
            }

            this.responseItems = this.responses
              .filter(x => x.key !== params.response)
              .filter(x => !x.max_score || x.max_score.value >= this.api.MIN_SCORE)
              .map(x => this.responsesMap[x.key || ''])
              .filter(x => !!x);
          }
          this.categories = data.categories;
          this.responseCategoryItems = this.categories
            .map(x => x.key)
            .map(x => this.responsesMap['human_services:' + x])
            .filter(x => !!x);
        }),
      ).subscribe();
    }
    this.currentSearchParams = this._copySearchParams(params || this.searchParams);
  }

  checkDiscoveryNeeded(result: QueryCardResult): void {
    const THRESHOLD = 40;
    if (this.platform.server()) {
      return;
    }
    if (result.search_counts._current.total_overall > THRESHOLD) {
      const possibleFilters = [...(result.situations || []), ...(result.responses || [])].filter(x => (x.doc_count || 0) < THRESHOLD);
      if (possibleFilters.length < 3) {
        return;
      }
      if (this.showDiscovery === null) {
        this.showDiscovery = true;
        merge(
          fromEvent(window, 'mousedown'),
          fromEvent(window, 'touchstart')
        ).pipe(first()).subscribe(() => {
          this.showDiscovery = false;
        });
      }
    }
  }

  set active(value: boolean) {
    this.activate.emit(value);
    this.active_ = value;
    if (value) {
      this.processSearchParams(this.searchParams);
      this.pushSearchParams();
    }
  }

  get active() {
    return this.active_;
  }

  get totalFilters(): number {
    const sp = this.currentSearchParams || this.searchParams;
    return (sp?.filter_responses?.length || 0) + 
            SITUATION_FILTERS.reduce((partialSum, f) => partialSum + ((sp as any || {})['filter_' + f]?.length || 0), 0);
  }

  _copySearchParams(sp: SearchParams): SearchParams {
    const ret = new SearchParams();
    Object.assign(ret, {
      query: sp.query,
      response: sp.response,
      situation: sp.situation,
      org_id: sp.org_id,
      org_name: sp.org_name,
      filter_situations: sp.filter_situations?.slice() || [],
      filter_age_groups: sp.filter_age_groups?.slice() || [],
      filter_languages: sp.filter_languages?.slice() || [],

      filter_health: sp.filter_health?.slice() || [],
      filter_benefit_holders: sp.filter_benefit_holders?.slice() || [],
      filter_employment: sp.filter_employment?.slice() || [],
      filter_life_events: sp.filter_life_events?.slice() || [],
      filter_urgency: sp.filter_urgency?.slice() || [],
      filter_community: sp.filter_community?.slice() || [],
      filter_role: sp.filter_role?.slice() || [],
      filter_gender: sp.filter_gender?.slice() || [],

      filter_responses: sp.filter_responses?.slice() || [],
      filter_response_categories: sp.filter_response_categories?.slice() || [],

      national: !!sp.national,

      bounds: sp.bounds,
    });
    return ret;
  }
  
  sortResponses(responses: DistinctItem[], categories: DistinctItem[]) {
    const categoryOrder: any = {};
    categories.forEach((c, i) => categoryOrder[c.key || ''] = i);
    responses.sort((a, b) => {
      const catA = a.key?.split(':')[1] || '';
      const catB = b.key?.split(':')[1] || '';
      if (catA === catB) {
        return a.key?.localeCompare(b.key || '') || 0;
      } else {
        return (categoryOrder[catA] || 0) - (categoryOrder[catB] || 0);
      }
    });
    return responses;
  }

  isResponseSelected(response: TaxonomyItem) {
    if (response.id && this.currentSearchParams?.filter_responses) {
      return this.currentSearchParams.filter_responses.indexOf(response.id) !== -1;
    } else {
      return false;
    }
  }

  isResponseCategorySelected(response: TaxonomyItem) {
    if (response.id && this.searchParams?.filter_response_categories) {
      return this.searchParams.filter_response_categories.indexOf(response.id) !== -1;
    } else {
      return false;
    }
  }

  isResponseCategoryDisabled(response: TaxonomyItem) {
    return !!this.searchParams?.filter_response_categories && this.searchParams.filter_response_categories.length > 0 && !this.isResponseCategorySelected(response);
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
      this.currentSearchParams.filter_responses = this.currentSearchParams.filter_responses.filter(x => item.id?.indexOf(x) !== 0);
      this.currentSearchParams.filter_responses = this.currentSearchParams.filter_responses.filter(x => x.indexOf(item.id || 'xxx') !== 0);
      this.currentSearchParams.filter_responses.push(item.id);
    }
    this.pushSearchParams();
  }

  toggleResponseCategory(item: TaxonomyItem) {
    const checked = !this.isResponseCategorySelected(item);
    const sp = this._copySearchParams(this.searchParams);
    sp.filter_response_categories = sp.filter_response_categories || [];
    sp.filter_response_categories = sp.filter_response_categories.filter(x => x !== item.id);
    if (checked && item.id) {
      sp.filter_response_categories.push(item.id);
    }
    this.params.emit(sp);
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

  clear() {
    SITUATION_FILTERS.forEach(f => (this.currentSearchParams as any)['filter_' + f] = []);
    this.currentSearchParams.filter_responses = [];
    this.closeWithParams();
  }

  closeWithParams() {
    const sp = this._copySearchParams(this.currentSearchParams);
    this.fixSearchParams(sp);
    this.params.emit(sp);
    this.active = false;
  }
}