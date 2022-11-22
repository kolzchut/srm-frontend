import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SeoSocialShareService } from 'ngx-seo';
import { from, Observable, Subject, timer } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, first, map, switchMap, tap, throttleTime } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { AutoComplete, DrawerState, SearchParams } from '../consts';
import { MapComponent } from '../map/map.component';
import { SearchFiltersComponent } from '../search-filters/search-filters.component';

class SearchParamCalc {
  query?: string;
  queryP?: string;
  queryQP?: string;
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
    return [this.query, this.queryP, this.queryQP, this.fs, this.fag, this.fl, this.fr].map(x => x || '').join('|');
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
  
  searchParamsCalc = new Subject<SearchParamCalc>(); 
  currentSearchParamCalc: SearchParamCalc = new SearchParamCalc();
  mapNeedsCentering = false;
  
  branchSize_ = 0;
  drawerSize_ = 0;
  padding = 0;

  acResult: any;
  acQuery: string;

  constructor(private route: ActivatedRoute, private api: ApiService, private router: Router, private seo: SeoSocialShareService) {

    this.searchParamsCalc.pipe(
      untilDestroyed(this),
      throttleTime(100, undefined, {leading: true, trailing: true}),
      distinctUntilChanged((x, y) => {
        return x.geoHash.localeCompare(y.geoHash) === 0
      }),
    ).subscribe((spc) => {
      if (spc.geoValues?.length && this.mapNeedsCentering) {
        console.log('CENTERING MAP', spc.geoValues);
        this.map?.queueAction((map) => map.jumpTo({center: [spc.geoValues[0], spc.geoValues[1]], zoom: spc.geoValues[2]}),
                              're-center-' + spc.geoValues[0] + ',' + spc.geoValues[1]);
        this.mapNeedsCentering = false;
      }  
    });

    this.searchParamsCalc.pipe(
      untilDestroyed(this),
      debounceTime(100),
      map((spc) => {
        spc.query = spc.queryP || spc.queryQP || '';
        spc.query = spc.query.split('_').join(' ');
        this.query = spc.query;
        return spc;
      }),
      distinctUntilChanged((x, y) => {
        return x.cardsHash.localeCompare(y.cardsHash) === 0
      }),
      switchMap((spc) => {
        if (spc.query && spc.query !== '') {
          if (this.stage === 'search-results') {
            this.seo.setTitle(`כל שירות - חיפוש ${spc.query}`)
            this.seo.setUrl(window.location.href);
          }
          return this.getAutocomplete(spc);
        } else {
          return from([spc])
        }
      }),
    ).subscribe((spc) => {
      console.log('SEARCH PARAMS CALC', spc);
      const fs = spc.fs?.split('|').map(x => 'human_situations:' + x) || [];
      const fag = spc.fag?.split('|').map(x => 'human_situations:age_group:' + x) || [];
      const fl = spc.fl?.split('|').map(x => 'human_situations:language:' + x) || [];
      const fr = spc.fr?.split('|').map(x => 'human_services:' + x) || [];
      this.searchParams = new SearchParams();
      if (spc.ac) {
        Object.assign(this.searchParams, {
          acQuery: spc.query,
          query: null,
          response: spc.ac.response,
          situation: spc.ac.situation,
          filter_situations: fs,
          filter_age_groups: fag,
          filter_languages: fl,
          filter_responses: fr,
          bounds: spc.bounds,
        });
      } else {
        Object.assign(this.searchParams, {
          acQuery: spc.query,
          query: spc.query,
          response: null,
          situation: null,
          filter_situations: fs,
          filter_age_groups: fag,
          filter_languages: fl,
          filter_responses: fr,
          bounds: spc.bounds,
        });
      }
    });
    route.params.pipe(
      untilDestroyed(this),
    ).subscribe(params => {
      this.card = params.card || '';
      this.point = params.point || '';
      this.currentSearchParamCalc.queryP = params.query || '';
      this.pushSearchParamsCalc();
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
    });
    route.queryParams.pipe(
      untilDestroyed(this),
    ).subscribe(params => {
      this.currentSearchParamCalc.queryQP = params.q || '';
      this.currentSearchParamCalc.fs = params.fs;
      this.currentSearchParamCalc.fag = params.fag;
      this.currentSearchParamCalc.fl = params.fl;
      this.currentSearchParamCalc.fr = params.fr;
      this.pushSearchParamsCalc();
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
        q: this.currentSearchParamCalc.queryQP || null,
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
        this.mapNeedsCentering = true;
      });  
    }
    this.map_ = map;
    timer(500).subscribe(() => {
      this.setPadding();
    });
    this.pushSearchParamsCalc();
  }

  get map(): MapComponent {
    return this.map_;
  }

  setPadding() {
    const padding = this.branchSize + this.drawerSize;
    if (this.map && padding !== this.padding) {
      this.padding = padding;
      this.map?.queueAction((map) => {
        map.setPadding({top: 0, bottom: this.padding, left: 0, right: 0}, {ignore: true})
      }, 'padding-' + this.padding);
    }
  }

  set branchSize(branchSize: number) {
    if (this.branchSize_ !== branchSize) {
      this.branchSize_ = branchSize;
      this.setPadding();
    }
  }

  get branchSize() {
    return this.stage === 'point' || this.stage === 'card' ? this.branchSize_ : 0;
  }

  set drawerSize(drawerSize: number) {
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
    const query = spc.query as string;
    if (spc.query !== this.acQuery) {
      obs = this.api.getAutocompleteEntry(query);
    } else {
      obs = from([this.acResult]);
    }
    return obs
      .pipe(
        tap((ac) => {
          this.acQuery = query;
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
    this.drawerState = DrawerState.Half;
  }
}
