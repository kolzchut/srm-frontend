import { Injectable, NgZone } from '@angular/core';
import { from, Observable, ReplaySubject } from 'rxjs';
import { catchError, delay, finalize, map, switchMap, tap } from 'rxjs/operators';

import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Card, QueryPresetResult, Preset, AutoComplete, QueryAutoCompleteResult, QueryCardResult, CARD_SNIPPET_FIELDS, TaxonomyItem, SearchParams, DistinctItem, QueryTaxonomyItemResult } from './consts';
import { makeStateKey, TransferState} from '@angular/platform-browser';
import { PlatformService } from './platform.service';
import * as memoryCache from 'memory-cache';
import { response } from 'express';
import { LngLatBounds } from 'mapbox-gl';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  waiting: any = {};

  MIN_SCORE = 20
  situationsMap_: any = {};
  responsesMap_: any = {};
  collapseCount: {[key: string]: number} = {};

  constructor(
    private http: HttpClient,
    private transferState: TransferState,
    private platform: PlatformService,
    private zone: NgZone,
  ) {}

  innerCache<T>(key: string, fetcher: Observable<T>, keep=false): Observable<T> {
    const stateKey = makeStateKey<T | null>(key);
    const cached = memoryCache.get(stateKey);
      // console.log('GOT MEM CACHED', !!cached, stateKey);
    if (cached) {
      if (this.platform.server()) {
        this.transferState.set(stateKey, cached);
      }
      return from([cached]);
    }
    if (this.transferState.hasKey(stateKey)) {
      // console.log('GOT CACHED', stateKey);
      const val: T | null = this.transferState.get<T | null>(stateKey, null);
      if (!keep) {
        this.transferState.remove(stateKey);
      }
      if (val !== null) {
        return from([val]);
      }
    // } else {
    //   console.log('MISS CACHED', stateKey);
    }
    if (this.waiting[key]) {
      return this.waiting[key];
    }
    this.waiting[key] = new ReplaySubject<T>(1);
    fetcher.pipe(
      tap(val => {
        this.platform.server(() => {
          // console.log('SET CACHED', stateKey);
          this.transferState.set(stateKey, val);
        });
        const timeout = this.platform.server() ? (keep ? 3600000 : 60000) : 120000;
        this.zone.runOutsideAngular(() => {
          memoryCache.put(stateKey, val, timeout);
        });
        this.waiting[key].next(val);
        this.waiting[key].complete();
      }),
      delay(this.platform.server() ? 0 : 5000),      
    ).subscribe(() => {
      delete this.waiting[key];
    });
    return this.waiting[key];
  }

  boundsFilter(bounds: number[][]) {
    return bounds;
  }

  _filter(searchParams?: SearchParams | null, bound=true): any | null {
    let filter: any | null = null;
    if (searchParams && (searchParams.response || searchParams.situation || searchParams.filter_responses || 
        searchParams.filter_situations || searchParams.filter_age_groups || searchParams.filter_languages)) {
      filter = {};
      if (searchParams.response) {
        filter['response_ids'] = searchParams.response;
      }
      if (searchParams.filter_responses?.length) {
          filter['response_ids#1'] = searchParams.filter_responses;
      }
      if (searchParams.situation) {
        filter['situation_ids'] = searchParams.situation;
      }
      if (searchParams.filter_situations?.length) {
          filter['situation_ids#1'] = searchParams.filter_situations;
      }
      if (searchParams.filter_age_groups?.length) {
          filter['situation_ids#2'] = searchParams.filter_age_groups;
      }
      if (searchParams.filter_languages?.length) {
          filter['situation_ids#3'] = searchParams.filter_languages;
      }
      if (searchParams.bounds && searchParams.bounds.length === 2 && bound) {
          filter['branch_geometry__bounded'] = this.boundsFilter(searchParams.bounds);
      }
      if (searchParams.org_id) {
        filter['organization_id'] = searchParams.org_id;
      }

    }
    return filter;
  }

  getPresets(): Observable<Preset[]> {
    const params = {size: 17, order: 'score'};
    return this.innerCache(
      'presets',
      this.http.get(environment.presetsURL, {params}).pipe(
        map((res) => {
          const results = res as QueryPresetResult;
          return results.search_results.map((r: any) => r.source);
        })
      ), true
    );
  }

  getAutoComplete(query: string): Observable<AutoComplete[]> {
    const params = {
      size: 6,
      q: query,
      highlight: 'query,query._2gram,query._3gram,query.hebrew',
      match_operator: 'and',
      filter: JSON.stringify([{visible: true}]),
    };
    return this.http.get(environment.autocompleteURL, {params}).pipe(
        map((res) => {
          const results = res as QueryAutoCompleteResult;
          return results.search_results
              .map((r: any) => r.source)
              // .filter((r: any) => r.query !== query)
              // .slice(0, 5)
          ;
        })
    );
  }

  getAutocompleteEntry(query: string): Observable<AutoComplete | null> {
    return this.innerCache(`autocomplete-${query}`,
      this.http.get(
        environment.itemURL + encodeURIComponent(query),
        {params: {type: 'autocomplete'}}
      ).pipe(
        map((res: any) => {
          return res as AutoComplete;
        }),
        catchError((err) => {
          if (err.status === 404) {
            return from([null]);
          } else {
            return from([]);
          }
        }),
      ), true
    );
  }

  getCard(id: string): Observable<Card> {
    return this.innerCache(`card-${id}`, this.http.get(environment.itemURL + id).pipe(
      map((res: any) => {
        return res as Card;
      })
    ));
  }

  getCards(searchParams: SearchParams, offset=0): Observable<Card[]> {
    const params: any = {
      size: 10,
      offset: offset,
      // order: '-_score'
    };
    if (searchParams.query) {
      params.q = searchParams.query;
      params.highlight = 'service_name,service_name.hebrew';
      params.snippets = CARD_SNIPPET_FIELDS.join(',');
      params.minscore = this.MIN_SCORE;
    } else if (searchParams.structured_query) {
      params.q = searchParams.structured_query;
    }
    if (offset === 0) {
      params.extra = 'national-services|collapse|collapse-collect';
    } else {
      params.extra = 'national-services|collapse';
    }
    const filters = [];
    if (!searchParams.national) {
      const filter = this._filter(searchParams);
      if (filter) {
        filters.push(filter);
      }  
    }
    const filter2 = this._filter(searchParams, false);
    if (filter2) {
      filter2.national_service = true;
      filters.push(filter2);
    }
    params.filter = JSON.stringify(filters);
    return this.http.get(environment.cardsURL, {params}).pipe(
      map((res: any) => {
        const qcr = res as QueryCardResult;
        if (qcr.collapse_key) {
          this.collapseCount = {};
          qcr.collapse_key.forEach((c: DistinctItem) => {
            if (c.key && c.doc_count) {
              this.collapseCount[c.key] = c.doc_count;
            }
          });
        }
        const results = qcr.search_results;
        const ret = results.map((r: any) => {
          r = r.source;
          r._collapse_count = (this.collapseCount[r.collapse_key] || 1) - 1;
          return r;
        });
        if (ret.length > 0) {
          ret[0].__counts = qcr.search_counts?._current || 0;
        }
        return ret;
      })
    );
  }

  didYouMean(searchParams: SearchParams): Observable<string | null> {
    return from([null]).pipe(
      switchMap(() => {
        if (searchParams.query) {
          return this.getAutoComplete(searchParams.query).pipe(
            map((results) => {
              if (results && results.length) {
                return results[0].query;
              } else {
                return null;
              }
            })
          );
        } else {
          return from([null]);
        }
      }),
      switchMap((suggestion) => {
        if (suggestion) {
          return from([suggestion]);
        }
        const SHARD_SIZE = 50;
        const params: any = {
          size: 1,
          offset: 0,
          extra: 'did-you-mean',
          q: searchParams.query
        };
        const filter = this._filter(searchParams, false);
        if (filter) {
          params.filter = JSON.stringify(filter);
        }
        return this.http.get(environment.cardsURL, {params}).pipe(
          map((res: any) => {
            const qcr = res as QueryCardResult;
            if (qcr.possible_autocomplete && qcr.possible_autocomplete.length) {
              const best = qcr.possible_autocomplete[0];
              const total = qcr.search_counts?._current?.total_overall || 0;
              const best_doc_count = best.doc_count || 0;
              const threshold = (total > SHARD_SIZE ? SHARD_SIZE : total) / 3;
              console.log('did you mean', best.key, best_doc_count, total);
              if (best_doc_count <= SHARD_SIZE && best_doc_count > threshold && best.key) {
                return best.key;
              }
            }
            return null;
          }),
        );    
      })
    );
  }

  getCardsForCollapseKey(searchParams: SearchParams, collapse_key: string): Observable<Card[]> {
    const params: any = {
      size: 1000,
      offset: 0,
      order: '-_score'
    };
    if (searchParams.query) {
      params.q = searchParams.query;
      params.highlight = 'service_name,service_name.hebrew';
      params.snippets = CARD_SNIPPET_FIELDS.join(',');
      params.minscore = this.MIN_SCORE;
    } else if (searchParams.structured_query) {
      params.q = searchParams.structured_query;
    }
    const filter = this._filter(searchParams);
    filter['collapse_key'] = collapse_key;
    if (filter) {
      params.filter = JSON.stringify(filter);
    }
    return this.http.get(environment.cardsURL, {params}).pipe(
      map((res: any) => {
        const qcr = res as QueryCardResult;
        const results = qcr.search_results;
        return results.map((r: any) => {
          r = r.source;
          return r;
        });
      })
    );
  }
  
  getCounts(searchParams: SearchParams, withBounds=false): Observable<QueryCardResult> {
    const params: any = {
      size: 2,
      offset: 0,
    };
    if (searchParams.query) {
      params.q = searchParams.query;
      params.minscore = this.MIN_SCORE;
    }
    let filter = this._filter(searchParams, false);
    if (searchParams.national) {
      filter = filter || {};
      filter.national_service = true;
    }
    if (filter) {
      params.filter = JSON.stringify(filter);
    }
    if (!withBounds) {
      params.extra = 'viewport';
    }
    return this.innerCache(`count-${params.filter}-${params.q}`, this.http.get(environment.cardsURL, {params}).pipe(
      map((res: any) => {
        return res as QueryCardResult;
      })
    ));
  }

  getNationalCounts(searchParams: SearchParams): Observable<QueryCardResult> {
    const params: any = {
      size: 2,
      offset: 0,
    };
    if (searchParams.query) {
      params.q = searchParams.query;
      params.minscore = this.MIN_SCORE;
    }
    const filter = this._filter(searchParams, false) || {};
    filter.national_service = true;
    params.filter = JSON.stringify(filter);
    return this.innerCache(`ncount-${params.filter}-${params.q}`, this.http.get(environment.cardsURL, {params}).pipe(
      map((res: any) => {
        return res as QueryCardResult;
      })
    ));
  }

  getDistinct(searchParams: SearchParams): Observable<QueryCardResult> {
    const params: any = {
      size: 1,
      offset: 0,
    };
    if (searchParams.query) {
      params.q = searchParams.query;
      params.minscore = this.MIN_SCORE;
    }
    params.extra = 'distinct-situations|distinct-responses';
    if (searchParams.response || searchParams.situation || searchParams.org_id || searchParams.national) {
      const filter: any = {};
      if (searchParams.response) {
        filter['response_ids'] = searchParams.response;
      }
      if (searchParams.situation) {
        filter['situation_ids'] = searchParams.situation;
      }
      if (searchParams.org_id) {
        filter['organization_id'] = searchParams.org_id;
      }
      if (searchParams.national) {
        filter['national_service'] = true;
      }
      params.filter = JSON.stringify([filter]);
    }
    return this.innerCache(`distinct-${params.filter}-${params.q}`, this.http.get(environment.cardsURL, {params}).pipe(
      map((res: any) => {
        return res as QueryCardResult;
      })
    ));
  }

  getCardForPoint(id: string): Observable<Card> {
    const params: any = {
      size: 1,
      filter: JSON.stringify([{point_id: id}])
    };
    return this.innerCache(`cfp-${id}`, this.http.get(environment.cardsURL, {params}).pipe(
      map((res: any) => {
        const results = (res as QueryCardResult).search_results;
        return results?.[0].source || null;
      })
    ));
  }

  getPoint(pointId: string, searchParams?: SearchParams | null): Observable<Card[]> {
    const params: any = {
      size: 70,
      offset: 0,
      order: '-_score'
    };
    if (searchParams?.query) {
      params.q = searchParams.query;
      params.highlight = 'service_name,service_name.hebrew';
      params.snippets = CARD_SNIPPET_FIELDS.join(',');
      params.minscore = this.MIN_SCORE;
    }
    const filter: any = {
      point_id: pointId,
    };
    const srFilter = this._filter(searchParams, false);
    if (srFilter) {
      Object.assign(filter, srFilter);
    }
    params.filter = JSON.stringify(filter);
    return this.innerCache(`point-${searchParams?.query}-${params.filter}`, this.http.get(environment.cardsURL, {params}).pipe(
      map((res: any) => {
        const results = (res as QueryCardResult).search_results;
        return results.map((r: any) => r.source);
      })
    ));
  }

  getTopCards(query: string): Observable<Card[]> {
    const params = {
      size: 3,
      q: query.replace(/ עבור /g, ' ').replace(/ של /g, ' ').replace(/ באיזור /g, ' '),
      highlight: 'branch_name,branch_name.hebrew,service_name,service_name.hebrew',
      match_operator: 'or',
      match_type: 'best_fields'
    };
    return this.http.get(environment.cardsURL, {params}).pipe(
        map((res) => {
          let results = (res as QueryCardResult).search_results;
           const scores = results.map((r: any) => r.score);
          if (results.length === 1) {
            // console.log('GOT SINGLE CARD', results);
          } else if (results.length > 1 && results[0].score > 1.25*results[1].score) {
            results = results.slice(0, 1);
            // console.log('GOT TOP CARD', results, scores);
          } else if (results.length === 2) {
            // console.log('GOT TWO CARDS', results);
          } else if (results.length > 2 && results[1].score > 1.25*results[2].score) {
            results = results.slice(0, 2);
            // console.log('GOT TWO TOP CARDS', results, scores);
          } else {
            results = [];
            // console.log('GOT NO TOP CARDS', results, scores);
          }
          return results.map((r: any) => r.source);
        })
    );
  }

  getResponse(id: string): Observable<TaxonomyItem> {
    return this.innerCache(
      `response-${id}`,
      this.http.get(environment.itemURL + id, {params: {type: 'responses'}}).pipe(
        map((res: any) => {
          return res as TaxonomyItem;
        })
      )
    );
  }

  getResponses(): Observable<TaxonomyItem[]> {
    return this.innerCache(
      'responses',
      this.http.get(environment.responsesURL, {params: {size: '1000'}}).pipe(
        map((res: any) => {
          return (res as QueryTaxonomyItemResult).search_results?.map((r: any) => r.source) || [];
        })
      ), true
    );
  }

  getSituation(id: string): Observable<TaxonomyItem> {
    return this.innerCache(
      `situation-${id}`,
      this.http.get(environment.itemURL + id, {params: {type: 'situations'}}).pipe(
        map((res: any) => {
          return res as TaxonomyItem;
        })
      )
    );
  }

  getSituations(): Observable<TaxonomyItem[]> {
    return this.innerCache(
      'situations',
      this.http.get(environment.situationsURL, {params: {size: '1000'}}).pipe(
        map((res: any) => {
          return (res as QueryTaxonomyItemResult).search_results?.map((r: any) => r.source) || [];
        })
      ), true
    );
  }

  getPoints(searchParams: SearchParams): Observable<string[]> {
    const params: any = {
      size: 1,
    };
    if (searchParams.query) {
      params.q = searchParams.query;
      params.minscore = this.MIN_SCORE;
      params.order = '-_score';
    }
    params.extra = 'point-ids';
    const filter = this._filter(searchParams, false);
    if (filter) {
      params.filter = JSON.stringify(filter);
    }

    return this.http.get(environment.cardsURL, {params}).pipe(
      map((res: any) => {
        const results = res as QueryCardResult;
        return results.point_id.map((r: any) => r.key).filter((r: any) => r !== 'national_service');
      })
    );
  }

  getInaccuratePoints(searchParams: SearchParams): Observable<any> {
    const params: any = {
      size: 1,
    };
    if (searchParams.query) {
      params.q = searchParams.query;
      params.minscore = this.MIN_SCORE;
      params.order = '-_score';
    }
    params.extra = 'point-ids-extended';
    const filter = this._filter(searchParams, false) || {};
    filter.branch_location_accurate = false;
    if (filter) {
      params.filter = JSON.stringify(filter);
    }
    return this.http.get(environment.cardsURL, {params}).pipe(
      map((res: any) => {
        const results = res as QueryCardResult;
        return results.point_id.map((r: any) => {
          return {
            point_id: r.key,
            response_category: r.response_category?.buckets[0]?.key,
            geometry: JSON.parse(r.branch_geometry?.buckets[0]?.key || 'null'),
            branch_count: r.branch_id?.buckets.length || 1,
          };
        }).filter((r: any) => r.point_id !== 'national_service');
      })
    );
  }

  getTotalServices(): Observable<number> {
    const params: any = {
      size: 1,
      offset: 0,
    };
    return this.innerCache(
      'total-services',
      this.http.get(environment.cardsURL, {params}).pipe(
        map((res: any) => {
          const qcr = res as QueryCardResult;
          return qcr.search_counts?._current?.total_overall || 0;
        })
      ), true
    );
  }
}
