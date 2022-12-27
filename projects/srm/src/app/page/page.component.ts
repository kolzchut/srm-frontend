import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { LngLatLike } from 'mapbox-gl';
import { SeoSocialShareService } from 'ngx-seo';
import { from, Observable, Subject, timer } from 'rxjs';
import { debounceTime, delay, distinctUntilChanged, filter, first, map, switchMap, tap, throttleTime } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { AutoComplete, DrawerState, SearchParams } from '../consts';
import { MapComponent } from '../map/map.component';
import { SearchFiltersComponent } from '../search-filters/search-filters.component';

class SearchParamCalc {
  acId: string;
  ftQuery: string;
  resolvedQuery: string;
  fs?: string;
  fr?: string;
  fag?: string;
  fl?: string;
  ac?: AutoComplete | null;
  geoValues: number[] = [];
  bounds: number[][] = [];

  get geoHash(): string {
    return this.bounds.map(b => b.map(bb => bb + '').join('|')).join('|')
  }

  get searchHash(): string {
    return [this.resolvedQuery, this.acId, this.ftQuery, this.fs, this.fag, this.fl, this.fr].map(x => x || '').join('|');
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
export class PageComponent implements OnInit {

  stage = '';
  card = '';
  point = '';
  query = '';
  searchParams: SearchParams;
  map_: MapComponent;

  DrawerState = DrawerState;
  drawerState = DrawerState.Half;
  
  @ViewChild('searchFilters') searchFilters: SearchFiltersComponent;
  filtersVisible: boolean | null = null;
  markerProps: any;
  
  searchParamsCalc = new Subject<SearchParamCalc>(); 
  currentSearchParamCalc: SearchParamCalc = new SearchParamCalc();
  // mapNeedsCentering = false;
  mapMoved = false;
  
  branchSize_ = 0;
  drawerSize_ = 0;
  padding = 0;

  acResult: any;
  ac_query: string;

  pendingActions: {action: (map: mapboxgl.Map) => void, description: string}[] = [];
  savedState: {center: LngLatLike, zoom: number} | null = null;

  constructor(private route: ActivatedRoute, private api: ApiService, private router: Router, private seo: SeoSocialShareService) {

    this.searchParamsCalc.pipe(
      untilDestroyed(this),
      // throttleTime(1000, undefined, {leading: false, trailing: true}),
      distinctUntilChanged((x, y) => {
        return x.geoHash.localeCompare(y.geoHash) === 0
      }),
    ).subscribe((spc) => {
      console.log('ACTION MAP MOVED', spc.geoValues, spc.ac?.bounds);
      this.mapMoved = true;
    });

    this.searchParamsCalc.pipe(
      untilDestroyed(this),
      debounceTime(100),
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
        if (spc.acId && spc.acId !== '') {
          return this.getAutocomplete(spc);
        } else {
          return from([spc])
        }
      }),
      tap((spc) => {
        if (this.stage === 'search-results') {
          if (spc.ac) {
            this.seo.setTitle(`כל שירות - חיפוש ${spc.ac.query}`)
            this.seo.setUrl(window.location.href);  
          } else {
            this.seo.setTitle(`כל שירות - חיפוש ${spc.ftQuery}`)
            this.seo.setUrl(window.location.href);  
          }
        }
      }),
      map((spc) => {
        console.log('SEARCH PARAMS CALC', spc);
        const fs = spc.fs?.split('|').map(x => 'human_situations:' + x) || [];
        const fag = spc.fag?.split('|').map(x => 'human_situations:age_group:' + x) || [];
        const fl = spc.fl?.split('|').map(x => 'human_situations:language:' + x) || [];
        const fr = spc.fr?.split('|').map(x => 'human_services:' + x) || [];
        const ret: SearchParams = new SearchParams();
        if (spc.ac) {
          Object.assign(ret, {
            ac_query: spc.ac.id || '_',
            query: null,
            original_query: spc.ac.query,
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
            filter_responses: fr,
            bounds: spc.bounds,
            ac_bounds: spc.ac.bounds,
            requiredCenter: spc.geoValues
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
            filter_responses: fr,
            bounds: spc.bounds,
            ac_bounds: null,
            requiredCenter: spc.geoValues
          });
        }
        this.searchParams = ret;
        return ret;
      }),
      distinctUntilChanged((a, b) => {
        return a.original_query === b.original_query;
      }),
      delay<SearchParams>(1000),
    ).subscribe((params: SearchParams) => {
      console.log('ACTION CHANGED TO', params.original_query, params.ac_bounds);
      if (params.ac_bounds) {
        const bounds: mapboxgl.LngLatBoundsLike = params.ac_bounds;
        this.queueMapAction((map) => {
          map.fitBounds(bounds, {padding: {top: 100, bottom: 100, left: 0, right: 0}, maxZoom: 15});
        }, 'search-by-location-' + params.city_name);
        this.queueMapAction((map) => {
          this.mapMoved = false;
          this.map.processAction();  
        }, 'map-moved-reset');
      } else if (params.requiredCenter && params.requiredCenter.length === 3) {
        const rc = params.requiredCenter;
        this.queueMapAction((map) => map.easeTo({center: [rc[0], rc[1]], zoom: rc[2]}), 're-center-' + rc[0] + ',' + rc[1]);
      } 
    });
    route.params.pipe(
      untilDestroyed(this),
    ).subscribe(params => {
      this.card = params.card || '';
      this.point = params.point || '';
      const q = (params.query || '_');
      this.currentSearchParamCalc.acId = q === '_' ? '' : q;
      this.pushSearchParamsCalc();

      if (this.card) {
        this.queueMapAction((map) => {
          if (!this.savedState) {
            this.savedState = {
              center: map.getCenter(),
              zoom: map.getZoom()
            };
            this.map.processAction();
          }
        }, 'save-map-state');
      } else if (!this.point) {
        this.queueMapAction((map) => {
          if (this.savedState) {
            map.easeTo({center: this.savedState.center, zoom: this.savedState.zoom});
            this.savedState = null;
          } else {
            this.map.processAction();
          }
        }, 'restore-map-state');
      }

    });
    route.data.pipe(
      untilDestroyed(this),
    ).subscribe((data: any) => {
      this.stage = data.stage;
      this.drawerState = DrawerState.Half;
      this.pushSearchParamsCalc();
      if (['about', 'search', 'homepage'].indexOf(this.stage) >= 0) {
        this.seo.setTitle(`כל שירות`);
        this.seo.setUrl(window.location.href);
      }
      if (this.searchFilters) {
        this.searchFilters.active = false;
      }
      timer(100).subscribe(() => {
        this.setPadding();
      });
    });
    route.queryParams.pipe(
      untilDestroyed(this),
    ).subscribe(params => {
      this.currentSearchParamCalc.ftQuery = params.q || '';
      this.currentSearchParamCalc.fs = params.fs;
      this.currentSearchParamCalc.fag = params.fag;
      this.currentSearchParamCalc.fl = params.fl;
      this.currentSearchParamCalc.fr = params.fr;
      if (this.stage === 'search-results') {
        this.pushSearchParamsCalc();
      }
    });
    this.route.fragment.pipe(
      first(),
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
  }

  ngOnInit(): void {
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
    if (!this.filtersVisible) {
      this.drawerState = map[this.drawerState + ':' + drawerEvent] || this.drawerState;
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
        fr: searchParams.filter_responses?.map(x => x.slice('human_services:'.length)).join('|') || null,
      },
      replaceUrl: true,
    });
  }

  pushSearchParamsCalc() {
    const spc = this.currentSearchParamCalc;
    this.currentSearchParamCalc = new SearchParamCalc();
    Object.assign(this.currentSearchParamCalc, spc);
    this.searchParamsCalc.next(spc);
  }

  set map(map: MapComponent) {
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
      this.map.queueAction(action, description);
    }
    this.pendingActions = [];
    // timer(500).subscribe(() => {
    //   this.queueMapAction((map) => {
    //     this.mapMoved = false;
    //   }, 'map-moved-reset');
    // });
  }

  get map(): MapComponent {
    return this.map_;
  }

  setPadding() {
    const padding = this.branchSize + this.drawerSize;
    if (padding !== this.padding) {
      this.padding = padding;
      this.queueMapAction((map) => {
        map.easeTo({padding: {top: 0, bottom: this.padding, left: 0, right: 0}}, {ignore: true})
      }, 'padding-' + this.padding);
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
    console.log('PADDING DS', drawerSize);
    if (this.drawerSize_ !== drawerSize) {
      this.drawerSize_ = drawerSize;
      this.setPadding();
    }
  }

  get drawerSize() {
    return this.stage === 'point' ? 64 : (this.stage === 'search-results' ? this.drawerSize_ : 0);
  }

  set bounds(bounds: number[][]) {
    if (this.drawerState !== DrawerState.Full) {
      this.currentSearchParamCalc.bounds = bounds;
      this.pushSearchParamsCalc();
    }
  }

  getAutocomplete(spc: SearchParamCalc) {
    let obs: Observable<AutoComplete | null>;
    if (spc.acId !== this.ac_query) {
      obs = this.api.getAutocompleteEntry(spc.acId);
    } else {
      obs = from([this.acResult]);
    }
    return obs
      .pipe(
        tap((ac) => {
          this.ac_query = spc.acId;
          this.acResult = ac;
        }),
        map((ac) => {
          spc.ac = ac;
          return spc;
        }),
      );
  }

  setFiltersVisible(visible: boolean) {
    this.filtersVisible = visible;
    if (visible) {
      this.drawerState = DrawerState.Half;
    }
    if (visible && this.point) {
      timer(0).pipe(
        switchMap(() => from(this.router.navigate(['/s', this.searchParams.ac_query], {queryParamsHandling: 'preserve'}))),
        filter((x) => !!x),
        delay(100),
      ).subscribe(() => {
        this.searchFilters.active = true;
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
    this.queueMapAction((map) => {
      map.easeTo({center, zoom: 15});
    }, 'center-map');
  }

  zoomOutMap() {
    this.queueMapAction((map) => {
      map.easeTo({
        center: [34.75, 32.2],
        zoom: 6.5,  
      });
    }, 'zoom-out-map');
  }
}

