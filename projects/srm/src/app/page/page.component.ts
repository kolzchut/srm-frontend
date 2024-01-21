import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { LngLatLike } from 'mapbox-gl';
import { SeoSocialShareService } from 'ngx-seo';
import { from, Observable, Subject, timer } from 'rxjs';
import { debounceTime, delay, distinctUntilChanged, filter, first, map, switchMap, tap, throttleTime } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { AutoComplete, Card, DrawerState, prepareQuery, SearchParams, SITUATION_FILTERS, ViewPort } from '../consts';
import { FocusOnRequest, MapComponent } from '../map/map.component';
import { SearchFiltersComponent } from '../search-filters/search-filters.component';
import { PlatformService } from '../platform.service';
import { LayoutService } from '../layout.service';
import * as mapboxgl from 'mapbox-gl';
import { AnalyticsService } from '../analytics.service';
import { A11yService } from '../a11y.service';
import { AreaSearchState } from '../area-search-selector/area-search-state';
import { FiltersState } from '../search-filters/filters-state';
import { WindowService } from '../window.service';
import { SearchState } from '../search-results/search-state';

class SearchParamCalc {
  acId: string;
  ftQuery: string;
  resolvedQuery: string;
  fs?: string;
  fr?: string;
  frc?: string;
  fag?: string;
  fl?: string;

  fbh?: string;
  fc?: string;
  fe?: string;
  fg?: string;
  fh?: string;
  fle?: string;
  frl?: string;
  fu?: string;

  ac?: AutoComplete | null;
  geoValues: number[] = [];
  bounds: number[][] = [];
  national: boolean;

  get geoHash(): string {
    return this.bounds.map(b => b.map(bb => bb + '').join('|')).join('|')
  }

  get searchHash(): string {
    return [this.resolvedQuery, this.acId, this.ftQuery, this.fs, this.fag, this.fl, 
      this.fbh, this.fc, this.fe, this.fg, this.fh, this.fle, this.frl, this.fu,
      this.fr, this.frc, this.national].map(x => x || '').join('|');
  }
  
  get cardsHash(): string {
    return this.geoHash + this.searchHash
  }
};


@UntilDestroy()
@Component({
  selector: 'app-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.less']
})
export class PageComponent implements OnInit, AfterViewInit, OnDestroy {

  stage = '';
  card = '';
  point = '';
  query = '';
  searchParams: SearchParams;
  searchParamsQueue = new Subject<SearchParams>();
  map_: MapComponent | null = null;

  DrawerState = DrawerState;
  drawerState = DrawerState.Half;
  
  @ViewChild('searchFilters') searchFilters: SearchFiltersComponent;
  filtersVisible: boolean | null = null;
  markerProps: any;
  
  searchParamsCalc = new Subject<SearchParamCalc>(); 
  currentSearchParamCalc: SearchParamCalc = new SearchParamCalc();
  // mapNeedsCentering = false;
  easeToProps: any = {};
  easeToQueue = new Subject<any>();
  
  branchSize_ = 0;
  drawerSize_ = 0;
  padding = -1;

  acResult: any;
  ac_query: string;

  pendingActions: {action: (map: mapboxgl.Map) => void, description: string}[] = [];
  savedState: {center: LngLatLike, zoom: number} | null = null;

  nationalCount = 0;
  visibleCount = 0;

  showLandingPageOverlay = false;
  isLandingPage = true;

  didYouMean: {display: string, link: string} | null = null;
  searchState: SearchState;
  areaSearchState: AreaSearchState;
  filtersState: FiltersState;
  focusOn = new Subject<FocusOnRequest>();

  @ViewChild('survey') survey: ElementRef;
  surveyMutationObserver: MutationObserver;
  surveyVisible = false;

  constructor(private route: ActivatedRoute, private api: ApiService, private router: Router, private seo: SeoSocialShareService,
              private platform: PlatformService, public layout: LayoutService, private analytics: AnalyticsService,
              public a11y: A11yService, private window: WindowService) {

    this.searchParamsCalc.pipe(
      untilDestroyed(this),
      // throttleTime(1000, undefined, {leading: false, trailing: true}),
      distinctUntilChanged((x, y) => {
        return x.geoHash.localeCompare(y.geoHash) === 0
      }),
      debounceTime(1000),
    ).subscribe((spc) => {
      const bounds = spc.bounds;
      if (bounds) {
        this.areaSearchState.checkNationWide({
          top_left: {lat: bounds[0][1], lon: bounds[0][0]}, bottom_right: {lat: bounds[1][1], lon: bounds[1][0]}
        })  
      }
    });

    this.searchParamsCalc.pipe(
      untilDestroyed(this),
      // throttleTime(1000, undefined, {leading: false, trailing: true}),
      distinctUntilChanged((x, y) => {
        return x.national === y.national
      }),
    ).subscribe((spc) => {
      console.log('NATIONAL CHANGED', spc.national);
      if (this.filtersState) {
        this.filtersState.active = false;
      }
    });

    this.searchParamsCalc.pipe(
      untilDestroyed(this),
      filter((spc) => {
        return this.stage === 'search-results';
      }),
      debounceTime(platform.browser() ? 100 : 0),
      delay(1),
      map((spc) => {
        spc.resolvedQuery = spc.acId || spc.ftQuery || '';
        spc.resolvedQuery = spc.resolvedQuery.split('_').join(' ');
        this.query = spc.resolvedQuery;
        return spc;
      }),
      distinctUntilChanged((x, y) => {
        return x.cardsHash.localeCompare(y.cardsHash) === 0
      }),
      switchMap((spc) => {
        return this.getAutocomplete(spc);
      }),
    ).pipe(
      map((spc) => {
        console.log('SEARCH PARAMS CALC', spc);
        if (this.stage === 'search-results') {
          this.seo.setTitle(`חיפוש ${spc.resolvedQuery} | כל שירות`);
          this.seo.setUrl(this.window.D.location.href);
          this.a11y.setTitle(`תוצאות חיפוש עבור ${spc.resolvedQuery} | כל שירות`);
        }

        const fs = spc.fs?.split('|').map(x => 'human_situations:' + x) || [];
        const fh = spc.fh?.split('|').map(x => 'human_situations:' + x) || [];
        const fbh = spc.fbh?.split('|').map(x => 'human_situations:benefit_holders:' + x) || [];
        const fe = spc.fe?.split('|').map(x => 'human_situations:employment:' + x) || [];
        const fle = spc.fle?.split('|').map(x => 'human_situations:life_events:' + x) || [];
        const fu = spc.fu?.split('|').map(x => 'human_situations:urgency:' + x) || [];
        const fc = spc.fc?.split('|').map(x => 'human_situations:community:' + x) || [];
        const frl = spc.frl?.split('|').map(x => 'human_situations:role:' + x) || [];
        const fg = spc.fg?.split('|').map(x => 'human_situations:gender:' + x) || [];
        const fag = spc.fag?.split('|').map(x => 'human_situations:age_group:' + x) || [];
        const fl = spc.fl?.split('|').map(x => 'human_situations:language:' + x) || [];
        const fr = spc.fr?.split('|').map(x => 'human_services:' + x) || [];
        const frc = spc.frc?.split('|').map(x => 'human_services:' + x) || [];
        const ret: SearchParams = new SearchParams();
        if (spc.ac) {
          Object.assign(ret, {
            ac_query: spc.ac.id || '_',
            query: null,
            original_query: spc.ac.query_heb,
            response: spc.ac.response,
            response_name: spc.ac.response_name,
            situation: spc.ac.situation,
            situation_name: spc.ac.situation_name,
            org_id: spc.ac.org_id,
            org_name: spc.ac.org_name,
            city_name: spc.ac.city_name,
            structured_query: spc.ac.structured_query,
            filter_situations: fs,
            filter_age_groups: fag,
            filter_languages: fl,
            filter_health: fh,
            filter_benefit_holders: fbh,
            filter_employment: fe,
            filter_life_events: fle,
            filter_urgency: fu,
            filter_community: fc,
            filter_role: frl,
            filter_gender: fg,
        
            filter_responses: fr,
            filter_response_categories: frc,

            bounds: spc.bounds,
            ac_bounds: spc.ac.bounds,
            requiredCenter: spc.geoValues,
            national: spc.national
          });
        } else {
          Object.assign(ret, {
            ac_query: '_',
            query: spc.resolvedQuery,
            original_query: spc.resolvedQuery,
            response: null,
            situation: null,
            org_id: null,
            org_name: null,
            city_name: null,
            filter_situations: fs,
            filter_age_groups: fag,
            filter_languages: fl,
            filter_health: fh,
            filter_benefit_holders: fbh,
            filter_employment: fe,
            filter_life_events: fle,
            filter_urgency: fu,
            filter_community: fc,
            filter_role: frl,
            filter_gender: fg,

            filter_responses: fr,
            filter_response_categories: frc,

            bounds: spc.bounds,
            ac_bounds: null,
            requiredCenter: spc.geoValues,
            national: spc.national
          });
        }
        this.searchParams = ret;
        this.searchParamsQueue.next(ret);
        return ret;
      }),
      switchMap((searchParams: SearchParams) => {
        const ret = this.needsDidYouMean(searchParams);
        console.log('DID YOU MEAN', ret, searchParams);
        if (!ret) {
          this.didYouMean = null;
          return from([searchParams]);
        } else {
          return this.api.didYouMean(searchParams).pipe(
            tap((didYouMean: string | null) => {
              if (!didYouMean) {
                this.didYouMean = null;
              } else {
                this.didYouMean = {
                  display: didYouMean,
                  link: didYouMean.split(' ').join('_')
                }
              }
            }),
            map(() => searchParams)
          );
        }
      }),
      distinctUntilChanged((a, b) => {
        return a.original_query === b.original_query && a.ac_query === b.ac_query;
      }),
      delay<SearchParams>(platform.browser() ? 1000 : 0),
      tap((params: SearchParams) => {
        // console.log('ACTION CHANGED TO', params.original_query, params.ac_bounds);
        if (params.ac_bounds) {
          const bounds = params.ac_bounds as [number, number, number, number];
          const viewPort: ViewPort = {
            top_left: {lat: bounds[3], lon: bounds[0]}, bottom_right: {lat: bounds[1], lon: bounds[2]}
          };
          this.areaSearchState.bounds.next(viewPort);
          this.areaSearchState.area_ = params.city_name;
        } else if (params.requiredCenter && params.requiredCenter.length === 3) {
          const rc = params.requiredCenter;
          this.easeTo({center: [rc[0], rc[1]], zoom: rc[2], duration: 0});
        }      
      }),
    ).subscribe();
    route.params.pipe(
      untilDestroyed(this),
    ).subscribe(params => {
      const prevCard = this.card;
      this.card = params.card || '';
      this.point = params.point || '';
      const q = (params.query || '_');
      this.currentSearchParamCalc.acId = q === '_' ? '' : q;
      this.pushSearchParamsCalc();

      if (this.card) {
        if (!prevCard) {
          this.queueMapAction((map) => {
            if (!this.savedState) {
              this.savedState = {
                center: map.getCenter(),
                zoom: map.getZoom()
              };
            }
            this.map?.processAction();
          }, 'save-map-state');
        } else if (prevCard !== this.card) {
          this.savedState = null
        }
      } else if (!this.point) {
          if (this.savedState) {
            console.log('ACTION - restore-map-state');
            this.easeTo({center: this.savedState.center, zoom: this.savedState.zoom});
            this.savedState = null;
          }    
        // this.queueMapAction((map) => {
        //   if (this.savedState) {
        //     map.easeTo({center: this.savedState.center, zoom: this.savedState.zoom});
        //     this.savedState = null;
        //   } else {
        //     this.map.processAction();
        //   }
        // }, 'restore-map-state');
      }

    });
    route.data.pipe(
      untilDestroyed(this),
    ).subscribe((data: any) => {
      const prevStage = this.stage;
      this.stage = data.stage;
      this.drawerState = DrawerState.Half;
      this.pushSearchParamsCalc();
      if (['about', 'search', 'homepage'].indexOf(this.stage) >= 0) {
        this.a11y.setSeoTitle(`כל שירות | במתכונת חירום | כל השירותים החברתיים, לכל מצב, בכל מקום`);
        this.seo.setUrl(this.window.D.location.href);
        this.api.getTotalServices().subscribe((totalServices: number) => {
          this.seo.setDescription(`כל השירותים למצב החירום המלחמתי וגם לשגרה. אספנו וסיווגנו ${totalServices.toLocaleString()} שירותים חברתיים מעשרות משרדי ממשלה, רשויות מקומיות, עמותות וארגונים אחרים. אנחנו בטוחים שנמצא גם משהו בשבילך!`);
        });
      }
      if (this.filtersState) {
        this.filtersState.active = false;
      }
      timer(100).subscribe(() => {
        this.setPadding();
      });
      if (prevStage !== '') {
        this.isLandingPage = false;
      }
      this.map?.setPopup(false, null);
    });
    route.queryParams.pipe(
      untilDestroyed(this),
    ).subscribe(params => {
      this.currentSearchParamCalc.ftQuery = params.q || '';
      this.currentSearchParamCalc.fs = params.fs;
      this.currentSearchParamCalc.fag = params.fag;
      this.currentSearchParamCalc.fl = params.fl;

      this.currentSearchParamCalc.fbh = params.fbh;
      this.currentSearchParamCalc.fc = params.fc;
      this.currentSearchParamCalc.fe = params.fe;
      this.currentSearchParamCalc.fg = params.fg;
      this.currentSearchParamCalc.fh = params.fh;
      this.currentSearchParamCalc.fle = params.fle;
      this.currentSearchParamCalc.frl = params.frl;
      this.currentSearchParamCalc.fu = params.fu;

      this.currentSearchParamCalc.fr = params.fr;
      this.currentSearchParamCalc.frc = params.frc;
      this.currentSearchParamCalc.national = params.national === 'yes';
      if (this.stage === 'search-results') {
        this.pushSearchParamsCalc();
      }
    });
    this.route.fragment.pipe(
      // first(),
      untilDestroyed(this),
    ).subscribe((fragment) => {
      if (fragment?.length && fragment[0] === 'g') {
        const parts = fragment.slice(1).split('/');
        if (parts.length === 3) {
          this.currentSearchParamCalc.geoValues = parts.map((v) => parseFloat(v));
          this.pushSearchParamsCalc();
        }
      } else {
        this.currentSearchParamCalc.geoValues = [];
      }
    });
    this.easeToQueue.pipe(
      untilDestroyed(this),
      debounceTime(platform.browser() ? 1000 : 0),
    ).subscribe((params) => {
      this.easeToProps = {};
      this.queueMapAction((map) => {
        // params.duration = 1000;
        if (params.curve) {
          map.flyTo(params);
        } else {
          map.easeTo(params);
        }
      }, 'ease-to-' + JSON.stringify(params));
    });
    if (this.platform.server()) {
      this.showLandingPageOverlay = false;
    }
    this.searchState = new SearchState();
    this.areaSearchState = new AreaSearchState(api, this.searchParamsQueue, this.searchState);
    this.areaSearchState.bounds.pipe(
      untilDestroyed(this),
    ).subscribe((bounds) => {
      this.zoomOutMap(bounds);
    });
    this.focusOn.pipe(
      untilDestroyed(this),
      debounceTime(100),
      switchMap((request) => {
        return  this.api.getPlaces(request.name).pipe(
          map((results) => {
            return {
              results, request
            };
          })
        );
      }),
    ).subscribe(({request, results}) => {
      this.areaSearchState.focusOn(request, results);
    });
    this.filtersState = new FiltersState(this.api, this.searchParamsQueue, this, this.platform);
    this.filtersState.params.pipe(
      untilDestroyed(this),
    ).subscribe((params) => {
      this.setSearchParams(params);
    });
    this.filtersState.activate.pipe(
      untilDestroyed(this),
    ).subscribe((active) => {
      this.setFiltersVisible(active);
    });
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.platform.browser(() => {
      this.surveyMutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            this.surveyVisible = (this.survey.nativeElement as HTMLElement).childElementCount > 0;
          }
        });
      });
      this.surveyMutationObserver.observe(this.survey.nativeElement, {
        childList: true,
      });
    });
  }

  ngOnDestroy(): void {
    this.platform.browser(() => {
      this.surveyMutationObserver?.disconnect();
    });
  }

  needsDidYouMean(searchParams: SearchParams) {
    return !!searchParams?.query && 
            !searchParams?.filter_responses?.length && 
            !searchParams?.filter_response_categories?.length && 
            !SITUATION_FILTERS.some((f) => !!((searchParams as any)['filter_' + f]?.length)) &&
            !searchParams?.org_id;
  }

  handleDrawer(drawerEvent: string) {
    const map: {[key: string]: DrawerState} = {
      'full:down': DrawerState.Half,
      'full:click': DrawerState.Half,
      'half:down': DrawerState.Peek,
      'half:up': DrawerState.Full,
      'peek:up': DrawerState.Half,
      'peek:click': DrawerState.Half,
    };
    this.drawerState = map[this.drawerState + ':' + drawerEvent] || this.drawerState;
    if (this.filtersVisible && this.drawerState === DrawerState.Peek) {
      this.drawerState = DrawerState.Half;
    }
  }

  setSearchParams(searchParams: SearchParams) {
    // this.searchParams = searchParams;
    this.router.navigate([], {
      queryParams: {
        q: this.currentSearchParamCalc.ftQuery || null,
        fs: searchParams.filter_situations?.map(x => x.slice('human_situations:'.length)).join('|') || null,
        fag: searchParams.filter_age_groups?.map(x => x.slice('human_situations:age_group:'.length)).join('|') || null,
        fl: searchParams.filter_languages?.map(x => x.slice('human_situations:language:'.length)).join('|') || null,
        fh: searchParams.filter_health?.map(x => x.slice('human_situations:'.length)).join('|') || null,
        fbh: searchParams.filter_benefit_holders?.map(x => x.slice('human_situations:benefit_holders:'.length)).join('|') || null,
        fe: searchParams.filter_employment?.map(x => x.slice('human_situations:employment:'.length)).join('|') || null,
        fle: searchParams.filter_life_events?.map(x => x.slice('human_situations:life_events:'.length)).join('|') || null,
        fu: searchParams.filter_urgency?.map(x => x.slice('human_situations:urgency:'.length)).join('|') || null,
        fc: searchParams.filter_community?.map(x => x.slice('human_situations:community:'.length)).join('|') || null,
        frl: searchParams.filter_role?.map(x => x.slice('human_situations:role:'.length)).join('|') || null,
        fg: searchParams.filter_gender?.map(x => x.slice('human_situations:gender:'.length)).join('|') || null,
        fr: searchParams.filter_responses?.map(x => x.slice('human_services:'.length)).join('|') || null,
        frc: searchParams.filter_response_categories?.map(x => x.slice('human_services:'.length)).join('|') || null,
      },
      replaceUrl: true,
      preserveFragment: true
    });
  }

  pushSearchParamsCalc() {
    const spc = this.currentSearchParamCalc;
    this.currentSearchParamCalc = new SearchParamCalc();
    Object.assign(this.currentSearchParamCalc, spc);
    this.searchParamsCalc.next(spc);
  }

  set map(map: MapComponent | null) {
    if (!map) {
      this.map_ = map;
      return;
    }
    if (!this.map_) {
      this.route.fragment.pipe(
        untilDestroyed(this),
        tap((fragment) => {
          if (fragment?.length && fragment[0] === 'g') {
            const parts = fragment.slice(1).split('/');
            if (parts.length === 3) {
              this.currentSearchParamCalc.geoValues = parts.map((v) => parseFloat(v));
              this.pushSearchParamsCalc();
            }
          } else {
            this.currentSearchParamCalc.geoValues = [];
          }
        }),
        first(),
      ).subscribe((fragment) => {
        // this.mapNeedsCentering = true;
      });  
    }
    this.map_ = map;
    // this.setPadding();
    this.pushSearchParamsCalc();
    for (const {action, description} of this.pendingActions) {
      this.map_.queueAction(action, description);
    }
    this.pendingActions = [];
    // timer(500).subscribe(() => {
    //   this.queueMapAction((map) => {
    //     this.mapMoved = false;
    //   }, 'map-moved-reset');
    // });
  }

  get map(): MapComponent | null {
    return this.map_;
  }

  setPadding() {
    if (this.layout.mobile()) {
      const padding = this.branchSize + this.drawerSize;
      if (padding !== this.padding) {
        const params: any = {padding: {top: 100, bottom: padding, left: 0, right: 0}};
        if (this.padding === -1) {
          params.duration = 0;
        }
        this.easeTo(params);
        this.padding = padding;
      }  
    } else {
      const padding = this.stage === 'search-results' || this.stage === 'card' ?  (this.window._?.innerWidth || 1000) / 2 : 0;
      // if (padding !== this.padding) {
      const params: any = {};
      if (this.padding === -1) {
        params.duration = 0;
      }
      this.padding = padding > 640 ? 640 : padding;
      params.padding = {top: 0, right: this.padding, left: 0, bottom: 0};
      this.easeTo(params);
      // }  
    }
  }

  set branchSize(branchSize: number) {
    console.log('PADDING BS', branchSize);
    if (this.branchSize_ !== branchSize) {
      this.branchSize_ = branchSize;
      this.setPadding();
    }
  }

  get branchSize() {
    return this.stage === 'point' || this.stage === 'card' ? this.branchSize_ : 0;
  }

  set drawerSize(drawerSize: number) {
    // console.log('PADDING DS', drawerSize);
    if (this.drawerSize_ !== drawerSize) {
      this.drawerSize_ = drawerSize;
      this.setPadding();
    }
  }

  get drawerSize() {
    return this.stage === 'point' ? 64 : (this.stage === 'search-results' ? this.drawerSize_ : 0);
  }

  set bounds(bounds: number[][]) {
    if (this.padding !== -1 && this.drawerState !== DrawerState.Full) {
      this.currentSearchParamCalc.bounds = bounds;      
      this.pushSearchParamsCalc();
    }
  }

  getAutocomplete(spc: SearchParamCalc) {
    let obs: Observable<AutoComplete | null>;
    if (!spc.acId && spc.ftQuery) {
      obs = this.api.getAutocompleteEntry(prepareQuery(spc.ftQuery));
    } else {
      if (spc.acId !== this.ac_query) {
        obs = this.api.getAutocompleteEntry(spc.acId);
      } else {
        obs = from([this.acResult]);
      }  
    }
    return obs
      .pipe(
        tap((ac) => {
          if (ac) {
            spc.acId = ac.id;
          }
          spc.ac = ac;
          this.ac_query = spc.acId;
          this.acResult = ac;
        }),
        map(() => {
          return spc;
        }),
      );
  }

  setFiltersVisible(visible: boolean) {
    this.filtersVisible = visible;
    if (visible) {
      this.drawerState = DrawerState.Half;
    }
    if (visible && this.point && this.platform.browser()) {
      timer(0).pipe(
        switchMap(() => 
          from(this.router.navigate(['/s', this.searchParams.ac_query], {queryParamsHandling: 'preserve'}))),
        filter((x) => !!x),
        delay(100),
      ).subscribe(() => {
        this.filtersState.active = true;
      });
    }  
  }

  queueMapAction(action: (map: mapboxgl.Map) => void, description: string) {
    if (this.map) {
      this.map.queueAction(action, description);
    } else {
      // console.log('ACTION PENDING', description);
      this.pendingActions.push({action, description});
    }
  }

  centerMap(center: LngLatLike) {
    timer(100).subscribe(() => {
      if (!this.map_ || this.map_.map?.getZoom() < 12) {
        console.log('ACTION CENTERING+ZOOMING', center);
        this.easeTo({center, zoom: 12, duration: 3000, curve: 1.42, easing: (t: number) => 1 - Math.pow(1 - t, 5)});
      } else {
        console.log('ACTION CENTERING', center);
        this.easeTo({center, duration: 3000, curve: 1.42, easing: (t: number) => 1 - Math.pow(1 - t, 5)});
      }
    });
  }

  zoomOutMap(viewport: ViewPort) {
    this.savedState = null;
    console.log('ZOOM OUT MAP', viewport.top_left.lat, viewport.top_left.lon, viewport.bottom_right.lat, viewport.bottom_right.lon)
    if (viewport && viewport.top_left && viewport.bottom_right && 
        !Number.isNaN(viewport.top_left.lat) && !Number.isNaN(viewport.top_left.lon) &&
        !Number.isNaN(viewport.bottom_right.lat) && !Number.isNaN(viewport.bottom_right.lon)) {
      if (!viewport.zoom) {
        this.queueMapAction((map) => {
          map.fitBounds([viewport.top_left, viewport.bottom_right], {padding: {top: 70, bottom: 10, left: 10, right: 10}, maxZoom: 15});
        }, 'zoom-out-map');
      } else {
        this.queueMapAction((map) => {
          map.flyTo({center: viewport.top_left, zoom: viewport.zoom});
        }, 'zoom-out-map');
      }
    }
  }

  easeTo(props: any) {
    this.easeToProps = Object.assign({}, this.easeToProps, props);
    this.easeToQueue.next(this.easeToProps);
    // this.easeToProps = {};
  }

  hoverCard(card: Card) {
    if (card?.branch_geometry && this.layout.desktop()) {
      this.map?.pointsHover.next({
        point_id: card.point_id,      
      });
    }
  }
}

