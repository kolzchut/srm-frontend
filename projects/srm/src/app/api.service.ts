import { Injectable, NgZone, Optional, Inject } from '@angular/core';
import { EMPTY, from, Observable, ReplaySubject } from 'rxjs';
import { catchError, delay, finalize, map, switchMap, tap } from 'rxjs/operators';

import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Card, QueryPresetResult, Preset, AutoComplete, QueryAutoCompleteResult, QueryCardResult, CARD_SNIPPET_FIELDS, TaxonomyItem, SearchParams, DistinctItem, QueryTaxonomyItemResult, SITUATION_FILTERS, Place, QueryPlaceResult, QueryHomepageResult, HomepageEntry } from './consts';
import { PlatformService } from './platform.service';
import * as memoryCache from 'memory-cache';
import { REQUEST } from '../express.tokens';
import { Request } from 'express';
import { LngLatBounds } from 'mapbox-gl';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  waiting: any = {};

  MIN_SCORE = 50
  situationsMap_: any = {};
  responsesMap_: any = {};
  // collapseCount: {[key: string]: number} = {};

  constructor(
    private http: HttpClient,
    private platform: PlatformService,
    private zone: NgZone,
    private router: Router,
    @Optional() @Inject(REQUEST) private request: Request
  ) {}

  innerCache<T>(key: string, fetcher: Observable<T>, keep=false): Observable<T> {
    const cached = memoryCache.get(key);
      // console.log('GOT MEM CACHED', !!cached, stateKey);
    if (cached) {
      return from([cached]);
    }
    if (this.waiting[key]) {
      return this.waiting[key];
    }
    this.waiting[key] = new ReplaySubject<T>(1);
    fetcher.pipe(
      tap(val => {
        const timeout = this.platform.server() ? (keep ? 3600000 : 60000) : 120000;
        this.zone.runOutsideAngular(() => {
          memoryCache.put(key, val, timeout);
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

  fullTextParams(params: any, options?: any) {
    options = options || {};
    params.match_operator = 'and';
    params.match_type = 'cross_fields';
    if (!options.no_highlight) {
      params.highlight = 'service_name,service_name.hebrew,organization_name,organization_short_name,branch_operating_unit,situations.name.hebrew,responses.name.hebrew';
      params.snippets = CARD_SNIPPET_FIELDS.join(',');
    }
    if (!options.no_minscore) {
      params.minscore = this.MIN_SCORE;
    }
  }

  _filter(searchParams?: SearchParams | null, bound=true): any | null {
    let filter: any | null = null;
    if (searchParams && (searchParams.response || searchParams.situation || searchParams.filter_responses ||
        SITUATION_FILTERS.some(f => (searchParams as any)['filter_' + f]) || searchParams.filter_response_categories ||
        searchParams.org_id
      )) {
      filter = {};
      if (searchParams.response) {
        filter['response_ids_parents'] = searchParams.response;
      }
      if (searchParams.filter_responses?.length) {
          filter['response_ids_parents#1'] = searchParams.filter_responses;
      }
      if (searchParams.filter_response_categories?.length) {
        filter['response_ids_parents#2'] = searchParams.filter_response_categories;
      }
      if (searchParams.situation) {
        filter['situation_ids_parents'] = searchParams.situation;
      }
      let situationFilters = 0;
      SITUATION_FILTERS.forEach((f) => {
        if ((searchParams as any)['filter_' + f]?.length) {
          filter['situation_ids_parents#' + situationFilters] = (searchParams as any)['filter_' + f];
          situationFilters++;
        }
      });
      if (searchParams.bounds && searchParams.bounds.length === 2 && bound) {
          filter['branch_geometry__bounded'] = this.boundsFilter(searchParams.bounds);
      }
      if (searchParams.org_id) {
        filter['organization_id'] = searchParams.org_id;
      }
      if (searchParams.org_name) {
        filter['organization_resolved_name'] = searchParams.org_name;
      }
    }
    return filter;
  }

  getPresets(): Observable<Preset[]> {
    const params = {size: 99, order: 'score'};
    return this.innerCache(
      'presets',
      this.http.get(environment.presetsURL, {params}).pipe(
        map((res) => {
          const results = res as QueryPresetResult;
          return results.search_results.map((r: any) => r.source)
        })
      ), true
    ).pipe(
      map((presets) => presets.filter((r: Preset) => r.preset))
    );
  }

  getHomepage(): Observable<HomepageEntry[]> {
    const params = {size: 200, order: 'score'};
    return this.innerCache(
      'hompage',
      this.http.get(environment.homepageURL, {params}).pipe(
        map((res) => {
          const results = res as QueryHomepageResult;
          return results.search_results.map((r: any) => r.source)
        })
      ), true
    );
  }

  getExamples(): Observable<Preset[]> {
    const params = {size: 99, order: 'score'};
    return this.innerCache(
      'presets',
      this.http.get(environment.presetsURL, {params}).pipe(
        map((res) => {
          const results = res as QueryPresetResult;
          return results.search_results.map((r: any) => r.source)
        })
      ), true
    ).pipe(
      map((presets) => presets.filter((r: Preset) => r.example))
    );
  }

  getEmergencies(): Observable<Preset[]> {
    const params = {size: 99, order: 'score'};
    return this.innerCache(
      'presets',
      this.http.get(environment.presetsURL, {params}).pipe(
        map((res) => {
          const results = res as QueryPresetResult;
          return results.search_results.map((r: any) => r.source)
        })
      ), true
    ).pipe(
      map((presets) => presets.filter((r: Preset) => r.emergency))
    );
  }

  getAutoComplete(query: string): Observable<AutoComplete[]> {
    const params = {
      size: 6,
      q: query,
      highlight: 'query,query._2gram,query._3gram,query.hebrew',
      match_operator: 'and',
      filter: JSON.stringify([{visible: true, low: false}]),
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
      }),
      catchError((err) => {
        if (err.status === 404) {
          this.platform.server(() => {
            if (this.request.res) {
              this.request.res.redirect(302, '/not-found');
              this.request.res.finished = true;
              this.request.res.end();
            }
          });
          return from([]);
        } else {
          return from([]);
        }
      })
    ));
  }

  getCards(searchParams: SearchParams, offset=0, zoomedIn=true): Observable<Card[]> {
    // if (this.platform.server()) {
    //   return from([]);
    // }
    const params: any = {
      size: offset == 0 ? 30 : 10,
      offset: offset,
      match_type: 'cross_fields'
      // order: '-_score'
    };
    if (searchParams.query) {
      params.q = searchParams.query;
      this.fullTextParams(params);
    } else if (searchParams.structured_query) {
      params.q = searchParams.structured_query;
      params.match_operator = 'or';
    }
    const extra = zoomedIn ? 'national-services|collapse' : 'collapse';
    if (offset === 0) {
      params.extra = extra + '|collapse-collect';
    } else {
      params.extra = extra;
    }
    const filters = [];
    const filter = this._filter(searchParams);
    if (filter) {
      filters.push(filter);
    }
    const filter2 = this._filter(searchParams, false);
    if (filter2) {
      filter2.national_service = true;
      filters.push(filter2);
    }
    params.filter = JSON.stringify(filters);
    return this.http.get(environment.cardsURL, {params}).pipe(
      map((res: any) => {
        console.log('Ariel = search params - get Cards', searchParams)
        console.log('Ariel - get Cards', res)

        const qcr = res as QueryCardResult;
        // if (qcr.collapse_key) {
        //   this.collapseCount = {};
        //   qcr.collapse_key.forEach((c: DistinctItem) => {
        //     if (c.key && c.doc_count) {
        //       this.collapseCount[c.key] = c.doc_count;
        //     }
        //   });
        // }
        const results = qcr.search_results;
        const ret = results.map((r: any) => {
          r = Object.assign(new Card(), r.source);
          // r._collapse_count = (this.collapseCount[r.collapse_key] || 1) - 1;
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
        console.log('did you mean', searchParams.query);
        const SHARD_SIZE = 50;
        const params: any = {
          size: 1,
          offset: 0,
          extra: 'did-you-mean',
          q: searchParams.query
        };
        this.fullTextParams(params, {no_highlight: true});
        const filter = this._filter(searchParams, false);
        if (filter) {
          params.filter = JSON.stringify(filter);
        }
        return this.http.get(environment.cardsURL, {params}).pipe(
          map((res: any) => {
            const qcr = res as QueryCardResult;
            const total = qcr.search_counts?._current?.total_overall || 0;
            if (total < 10) {
              return null;
            }
            if (qcr.possible_autocomplete && qcr.possible_autocomplete.length) {
              const factor = Math.log(qcr.possible_autocomplete[0].key?.length || 2) / Math.log(2);
              qcr.possible_autocomplete.forEach((p) => {
                p.doc_count = (p.doc_count || 0) * Math.log(p.key?.length || 2) / factor;
              });
              qcr.possible_autocomplete.sort((a, b) => (b.doc_count || 0) - (a.doc_count || 0));
              const best = qcr.possible_autocomplete[0];
              const best_doc_count = best.doc_count || 0;
              const threshold = (total < SHARD_SIZE ? total : SHARD_SIZE) / 3;
              if (best_doc_count <= SHARD_SIZE && best_doc_count > threshold && best.key) {
                return best.key;
              }
            }
            return null;
          }),
        );
      }),
      switchMap((suggestion) => {
        if (suggestion) {
          return from([suggestion]);
        }
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
    );
  }

  getCardsForCollapseKey(searchParams: SearchParams, collapse_key: string): Observable<Card[]> {
    const params: any = {
      size: 1000,
      offset: 0,
      // order: '-_score'
    };
    if (searchParams.query) {
      params.q = searchParams.query;
      this.fullTextParams(params, {no_minscore: true});
    } else if (searchParams.structured_query) {
      params.q = searchParams.structured_query;
      params.match_operator = 'or';
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
      this.fullTextParams(params, {no_highlight: true});
    }
    let filter = this._filter(searchParams, withBounds);
    if (filter) {
      params.filter = JSON.stringify(filter);
    }
    params.extra = 'viewport';
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
      this.fullTextParams(params, {no_highlight: true});
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

  getDistinct(searchParams: SearchParams, bound=false, policy: 'regular'|'static-filters'|'static-filters-update'='regular'): Observable<QueryCardResult> {
    const params: any = {
      size: 1,
      offset: 0,
    };
    if (searchParams.query) {
      params.q = searchParams.query;
      this.fullTextParams(params, {no_highlight: true});
    }
    if (policy === 'regular') {
      params.extra = 'distinct-situations-exact|distinct-responses';
    } else {
      params.extra = 'distinct-situations|distinct-situations-exact|distinct-responses|distinct-responses-exact';
    }
    if (policy === 'static-filters-update') {
      let filter = this._filter(searchParams, bound);
      if (filter) {
        params.filter = JSON.stringify(filter);
      }
    } else if (searchParams.response || searchParams.situation || searchParams.org_id || bound) {
      const filter: any = {};
      if (searchParams.response) {
        filter['response_ids_parents'] = searchParams.response;
      }
      if (searchParams.situation) {
        filter['situation_ids_parents'] = searchParams.situation;
      }
      if (searchParams.org_id) {
        filter['organization_id'] = searchParams.org_id;
      }
      if (searchParams.org_name) {
        filter['organization_resolved_name'] = searchParams.org_name;
      }
      if (bound && searchParams.bounds && searchParams.bounds.length === 2 && bound) {
        filter['branch_geometry__bounded'] = this.boundsFilter(searchParams.bounds);
      }
      params.filter = JSON.stringify([filter]);
    }
    return this.innerCache(`distinct-${params.filter}-${params.q}-${policy}`, this.http.get(environment.cardsURL, {params}).pipe(
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
      // order: '-_score'
    };
    if (searchParams?.query) {
      params.q = searchParams.query;
      this.fullTextParams(params);
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
      highlight: 'branch_city,branch_city.hebrew,service_name,service_name.hebrew',
      match_operator: 'or',
      match_type: 'cross_fields'
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
      this.fullTextParams(params, {no_highlight: true});
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

  getAllPoints(searchParams: SearchParams): Observable<any> {
    const params: any = {
      size: 30,
    };
    if (searchParams.query) {
      params.q = searchParams.query;
      this.fullTextParams(params, {no_highlight: true});
    }
    params.extra = 'point-ids-extended|collapse';
    const filter = this._filter(searchParams, false) || {};
    if (filter) {
      params.filter = JSON.stringify(filter);
    }
    let forceCategory: string | null = null;
    if (searchParams.filter_response_categories?.length === 1) {
      forceCategory = searchParams.filter_response_categories[0];
    } else if (searchParams.response) {
      forceCategory = searchParams.response;
    } else if (searchParams.filter_responses?.length === 1) {
      forceCategory = searchParams.filter_responses[0];
    }
    if (forceCategory) {
      forceCategory = forceCategory.split(':')[1];
    }
    return this.http.get(environment.cardsURL, {params}).pipe(
      map((res: any) => {
        const results = res as QueryCardResult;
        console.log('Ariel = search params - get all points', searchParams)
        console.log('Ariel -results', res)
        const allPoints = results.point_id.map((r: any) => {
          return {
            point_id: r.key,
            response_category: forceCategory || r.response_category?.buckets[0]?.key,
            geometry: JSON.parse(r.branch_geometry?.buckets[0]?.key || 'null'),
            branch_location_accurate: r.branch_location_accurate?.buckets[0]?.key,
            branch_count: r.branch_id?.buckets.length || 1,
          };
        }).filter((r: any) => r.point_id !== 'national_service');
        console.log('Ariel - all points', allPoints);
        return {
          inaccurate: allPoints.filter((p: any) => !p.branch_location_accurate),
          accurate: allPoints.filter((p: any) => !!p.branch_location_accurate),
        };
      })
    );
  }

  getIndexResponses(): Observable<AutoComplete[]> {
    const filter = [{"situation__empty":true, "response__exists": true, "org_id__empty":true, "city_name__empty":true}];
    const params: any = {
      size: 1000,
      filter: JSON.stringify(filter),
    };
    return this.innerCache(
      'index-responses',
      this.http.get(environment.autocompleteURL, {params}).pipe(
        map((res: any) => {
          const qcr = res as QueryAutoCompleteResult;
          return qcr.search_results.map((r: any) => r.source);
        })
      ), true
    );
  }

  getIndexSituations(): Observable<AutoComplete[]> {
    const filter = [{"situation__exists": true, "response__empty": true, "org_id__empty":true, "city_name__empty":true}];
    const params: any = {
      size: 1000,
      filter: JSON.stringify(filter),
    };
    return this.innerCache(
      'index-situations',
      this.http.get(environment.autocompleteURL, {params}).pipe(
        map((res: any) => {
          const qcr = res as QueryAutoCompleteResult;
          return qcr.search_results.map((r: any) => r.source);
        })
      ), true
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

  getPlaces(query: string): Observable<Place[]> {
    const params: any = {
      size: 50,
      offset: 0,
      q: query,
      highlight: 'query',
    };
    return this.http.get(environment.placesURL, {params}).pipe(
      map((res: any) => {
        const qpr = res as QueryPlaceResult;
        const results = qpr.search_results;
        const ret = results.map((r: any) => {
          return r.source;
        });
        return ret;
      })
    );
  }

}

