import { Subject, ReplaySubject, forkJoin, debounceTime, distinctUntilChanged, filter, switchMap, tap, merge, fromEvent, first, Observable, timer, from, map } from "rxjs";
import { DistinctItem, TaxonomyItem, SearchParams, QueryCardResult, SITUATION_FILTERS } from "../consts";
import { ApiService } from "../api.service";
import { untilDestroyed } from "@ngneat/until-destroy";
import { PlatformService } from "../platform.service";
import { AreaSearchState } from "../area-search-selector/area-search-state";

export class FiltersState {
  constructor(private api: ApiService, private searchParamsQueue: Observable<SearchParams>, 
      private attachedComponent: any, private platform: PlatformService,private areaSearchState: AreaSearchState) {
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
      untilDestroyed(attachedComponent),
      // distinctUntilChanged((a, b) => a.searchHash.localeCompare(b.searchHash) === 0),
      tap((params) => {
        this.params.next(this._copySearchParams(params));
      }),
      // switchMap((params) => forkJoin([
      //   this.api.getCounts(params),
      //   this.api.getCounts(params, true),
      // ]))
    // ).subscribe(([data, dataBounded]) => {
    //   this.resultCount = data.search_counts.cards.total_overall;
    //   this.resultCountBounded = dataBounded.search_counts.cards.total_overall;
    // });
    ).subscribe();
    this.incomingSearchParams.pipe(
      untilDestroyed(attachedComponent),
      filter((params) => !!params),
      distinctUntilChanged((a, b) => a.searchHash.localeCompare(b.searchHash) === 0),
    ).subscribe((params) => {
      this.processSearchParams(params);
    });
    this.incomingSearchParams.pipe(
      untilDestroyed(attachedComponent),
      filter((params) => !!params),
      distinctUntilChanged((a, b) => a.bounds === b.bounds),
    ).subscribe((params) => {
      this.currentSearchParams.bounds = params.bounds;
      this.pushSearchParams();
    });
    this.incomingSearchParams.pipe(
      untilDestroyed(attachedComponent),
      filter((params) => !!params),
      filter((params) => !params.hasFilters),
      debounceTime(this.platform.browser() ? 3000 : 0),
      switchMap((params) => this.api.getDistinct(params, true)),
    ).subscribe((result) => {
      this.checkDiscoveryNeeded(result);
    });
    this.incomingSearchParams.pipe(
      untilDestroyed(attachedComponent),
      filter((params) => !!params),
      distinctUntilChanged((a, b) => a.simpleHash.localeCompare(b.simpleHash) === 0),
      switchMap((params) => this.api.getDistinct(params, false, 'static-filters')), //here
    ).subscribe((result) => {
      this.updateStaticFilters(result);
    });
    this.searchParamsQueue.pipe(
        untilDestroyed(attachedComponent),
    ).subscribe((params) => {
        this.updateParams(params);
    });
    this.params.pipe(
      untilDestroyed(attachedComponent),
    ).subscribe((params) => {
      this.updateStaticFilterCounts(params);
    });
    this.areaSearchState.nationWide.pipe().subscribe((nationWide) => {
      this.updateStaticFilterCounts(this.currentSearchParams);
    });
  }

  searchParams: SearchParams;
  params = new Subject<SearchParams>();
  activate = new Subject<boolean>();

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
  situationsMap: {[key: string]: TaxonomyItem} = {};
  responsesMap: {[key: string]: TaxonomyItem} = {};

  currentSearchParams: SearchParams;
  restoreSearchParams: SearchParams;
  // resultCount = -1;
  // resultCountBounded = -1;

  incomingSearchParams = new Subject<SearchParams>();
  internalSearchParams = new Subject<SearchParams>();
  
  ready = new ReplaySubject<boolean>(1);

  showDiscovery: boolean | null = null;
  situationsOrder: {[key: string]: number} = {};

  staticFilters: DistinctItem[] = [];
  maxStaticFilters = 7;
  staticFiltersIds: string[] = [];
  allFilteredSituations: string[] = [];
  allFilteredResponses: string[] = [];

  updateParams(params: SearchParams) {
    this.searchParams = params;
    this.incomingSearchParams.next(params);
  }

  pushSearchParams() {
    const sp = this.currentSearchParams;
    this.currentSearchParams = this._copySearchParams(sp);
    this.fixSearchParams(sp);
    this.allFilteredSituations = sp.allFilteredSituations.sort((a: string, b: string) => (this.situationsOrder[a] || 0) - (this.situationsOrder[b] || 0));
    this.allFilteredResponses = this.currentSearchParams.filter_responses || [];
    if (this.active_) {
      this.internalSearchParams.next(sp);
    } else {
      this.params.next(sp);
    }
  }

  fixSearchParams(sp: SearchParams) {
    // if (sp.filter_age_groups?.length === this.age_groups.length) {
    //   sp.filter_age_groups = [];
    // }
  }

  _copySearchParams(sp: SearchParams): SearchParams {
    const ret = new SearchParams();
    Object.assign(ret, {
      query: sp.query,
      response: sp.response,
      situation: sp.situation,
      org_id: sp.org_id,
      org_name: sp.org_name,
      filter_audiences: sp.filter_audiences?.slice() || [],
      filter_age_groups: sp.filter_age_groups?.slice() || [],
      filter_languages: sp.filter_languages?.slice() || [],

      filter_health_issues: sp.filter_health_issues?.slice() || [],
      filter_benefit_holders: sp.filter_benefit_holders?.slice() || [],
      filter_employment: sp.filter_employment?.slice() || [],
      filter_life_events: sp.filter_life_events?.slice() || [],
      filter_urgency: sp.filter_urgency?.slice() || [],
      filter_community: sp.filter_community?.slice() || [],
      filter_role: sp.filter_role?.slice() || [],
      filter_gender: sp.filter_gender?.slice() || [],

      filter_responses: sp.filter_responses?.slice() || [],
      filter_response_categories: sp.filter_response_categories?.slice() || [],

      bounds: sp.bounds,
    });
    return ret;
  }

  getKeyForSituation(key: string): string | null {
    const keyParts = key.split(':');
    if (keyParts[0] !== 'human_situations') return null;
    const situationsMap = {
      audiences: ['armed_forces', 'citizenship', 'criminal_history', 'deprivation', 'education', 'household', 'housing', 'income', 'sectors', 'sexuality', 'survivors'],
      healthIssues: ['mental_health', 'substance_dependency', 'disability', 'health'],
      ageGroups: ['age_group'],
      languages: ['language'],
    }
    if (situationsMap.audiences.includes(keyParts[1])) return 'audiences';
    if (situationsMap.healthIssues.includes(keyParts[1])) return 'health_issues';
    if (situationsMap.ageGroups.includes(keyParts[1])) return 'age_groups';
    if (situationsMap.languages.includes(keyParts[1])) return 'languages';

    for (const hsroot of ['employment', 'benefit_holders', 'life_events', 'urgency', 'gender', 'community', 'role']) {
      if (key.indexOf('human_situations:' + hsroot) === 0) {
        return `others.${hsroot}`;
      }
    }
    
    return null;
  }

  processSearchParams(params: SearchParams): void {
    if (params) {
      this.ready.pipe(
        switchMap(() => this.api.getDistinct(params)),
        tap((data) => {
          if (this.active_) {
            this.situations = data.situations_exact;
            this.responses = this.sortResponses(data.responses, data.categories);

            this.others = {};
            this.situations
              .filter(x => !!x && !!x.key)
              .filter(x => x.key !== params.situation)
              .forEach(x => {
                const key = x.key as string;
                let situationKey = this.getKeyForSituation(key);
                const situation = this.situationsMap[key];
                if (situationKey && situation) {
                  let obj = this as any;
                  const parts = situationKey.split('.');
                  if (parts.length > 1) {
                    situationKey = parts[0];
                    obj[parts[0]] = obj[parts[0]] || {};
                    obj = obj[parts[0]];
                    situationKey = parts[1];
                  }
                  obj[situationKey] = obj[situationKey] || [];
                  obj[situationKey].push(situation);
                }
              });
                
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

  set active(value: boolean) {
    this.activate.next(value);
    this.active_ = value;
    if (value) {
      this.processSearchParams(this.searchParams);
      this.restoreSearchParams = this.currentSearchParams;
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

  get filtersBarOccupied(): boolean {
    return this.staticFilters.length > 0 || this.totalFilters > 0;
  }

  isSituationIdSelected(situationId: string, params: SearchParams | null = null) {
    const sp = params || this.currentSearchParams;
    return sp.allFilteredSituations.indexOf(situationId) !== -1;
  }

  isIdSelected(id: string) {
    return this.isSituationIdSelected(id) || this.isResponseIdSelected(id);
  }

  isSituationSelected(situation: TaxonomyItem, params: SearchParams | null = null) {
    return this.isSituationIdSelected(situation.id || '', params);
  }

  isResponseIdSelected(responseId: string, params: SearchParams | null = null) {
    const sp = params || this.currentSearchParams;
    const allFilteredResponses = sp.filter_responses || [];
    return allFilteredResponses.indexOf(responseId) !== -1;
  }

  isResponseSelected(response: TaxonomyItem, params: SearchParams | null = null) {
    return this.isResponseIdSelected(response.id || '', params);
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

  touchSituation(id: string) {
    this.situationsOrder[id || ''] = new Date().getTime();
  }

  toggleResponse(item: TaxonomyItem, params: SearchParams | null = null) {
    const checked = !this.isResponseSelected(item, params);
    const sp = (params || this.currentSearchParams);
    sp.filter_responses = sp.filter_responses || [];
    sp.filter_responses = sp.filter_responses.filter(x => x !== item.id);
    if (checked && item.id) {
      sp.filter_responses = sp.filter_responses.filter(x => item.id?.indexOf(x) !== 0);
      sp.filter_responses = sp.filter_responses.filter(x => x.indexOf(item.id || 'xxx') !== 0);
      sp.filter_responses.push(item.id);
    }
    sp.resetCachedProps();
    if (!params) {
      this.pushSearchParams();
    }
  }

  toggleResponseCategory(item: TaxonomyItem) {
    const checked = !this.isResponseCategorySelected(item);
    const sp = this._copySearchParams(this.searchParams);
    sp.filter_response_categories = sp.filter_response_categories || [];
    sp.filter_response_categories = sp.filter_response_categories.filter(x => x !== item.id);
    if (checked && item.id) {
      sp.filter_response_categories.push(item.id);
    }
    this.params.next(sp);
  }

  toggleSituation(item: TaxonomyItem, params: SearchParams | null = null) {
    if (!item.id) {
      return;
    }
    const sp = (params || this.currentSearchParams) as any;
    const field_parts = this.getKeyForSituation(item.id)?.split('.') || [];
    let field = '';
    if (field_parts.length === 1) {
      field = field_parts[0];
    } else if (field_parts.length === 2) {
      field = field_parts[1];
    } else {
      return
    }
    field = `filter_${field}`;
    let sits: string[] = sp[field] || [];
    if (sits.indexOf(item.id) === -1) {
      sits.push(item.id);
    } else {
      sits = sits.filter(x => x !== item.id);
    }
    sp[field] = sits;
    sp.resetCachedProps();
    if (!params) {
      this.touchSituation(item.id);
      this.pushSearchParams();
    }
  }

  toggleId(item: TaxonomyItem, params: SearchParams | null = null) {
    const sp = (params || this.currentSearchParams) as any;
    if (item.id?.indexOf('human_situations:') === 0) {
      this.toggleSituation(item, sp);
    }
    if (item.id?.indexOf('human_services:') === 0) {
      this.toggleResponse(item, sp);
    }
  }

  clearOne(item: TaxonomyItem) {
    SITUATION_FILTERS.forEach(f => {
      (this.currentSearchParams as any)['filter_' + f] = (this.currentSearchParams as any)['filter_' + f].filter((x: string) => x !== item.id);
    });
    this.pushSearchParams();
  }

  clear() {
    SITUATION_FILTERS.forEach(f => (this.currentSearchParams as any)['filter_' + f] = []);
    this.currentSearchParams.filter_responses = [];
    this.closeWithParams();
  }


  closeWithParams() {
    this.active = false;
    this.pushSearchParams();
  }

  cancel() {
    if (!this.active) {
      return;
    }
    this.currentSearchParams = this.restoreSearchParams;
    this.pushSearchParams();
  }

  cancelAndClose() {
    this.cancel();
    this.active = false;
  }

  toggle() {
    if (!this.active) {
      this.active = true;
    } else {
      this.closeWithParams();
    }
  }
  
  checkDiscoveryNeeded(result: QueryCardResult): void {
    const THRESHOLD = 40;
    if (this.platform.server()) {
      return;
    }
    if (result.search_counts._current.total_overall > THRESHOLD) {
      const possibleFilters = [...(result.situations_exact || []), ...(result.responses || [])].filter(x => (x.doc_count || 0) < THRESHOLD);
      if (possibleFilters.length < 3) {
        return;
      }
      if (this.showDiscovery === null) {
        this.showDiscovery = true;
        merge(
          fromEvent(window, 'mousedown'),
          fromEvent(window, 'touchstart'),
          timer(this.platform.browser() ? 10000 : 0)
        ).pipe(first()).subscribe(() => {
          this.showDiscovery = false;
        });
      }
    }
  }

  updateStaticFilters(result: QueryCardResult): void {
    this.staticFilters = [...(result.situations_exact || []), ...(result.responses_exact || [])]
        .filter(x => x.key !== this.currentSearchParams.situation)
        .filter(x => x.key !== this.currentSearchParams.response)
        .filter(x => !!x.doc_count && x.doc_count > 5)
        .sort((a, b) => (b.doc_count || 0) - (a.doc_count || 0))
        .slice(0, this.maxStaticFilters)
        .map(x => ({ key: x.key }));
    this.staticFiltersIds = this.staticFilters
        .map(x => x.key || '')
        .filter(x => x.length);
    this.updateStaticFilterCounts(this.currentSearchParams, result);
  }
  
  updateStaticFilterCounts(params: SearchParams, result: QueryCardResult | null = null): void {
    (result ? from([result]) : this.api.getCounts(params, !this.areaSearchState.nationWide_)).pipe(
      map((result) => {
        const count = result.search_counts._current.total_overall;
        return count;
      })
    ).subscribe((count) => {
      this.staticFilters.forEach((item) => {
        item.doc_count = undefined;
        if (this.isIdSelected(item.key || '')) {
          // No need to update count for selected items
          return;
        }
        const paramsCopy = this._copySearchParams(params);
        this.toggleId({id: item.key}, paramsCopy);
        this.api.getCounts(paramsCopy, !this.areaSearchState.nationWide_).subscribe((result) => {
          const new_doc_count = result.search_counts._current.total_overall;
          if (new_doc_count > count) {
              item.doc_count = new_doc_count - count;
              item.plus = true;
          } else {
              item.doc_count = new_doc_count;
              item.plus = false;
          }
        });
      });
    });
  }

  clearFilters() {
    this.allFilteredResponses = [];
    this.allFilteredSituations = [];
  }
}