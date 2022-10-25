import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { from, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { AutoComplete, DrawerState, SearchParams } from '../consts';

class SearchParamCalc {
  query?: string;
  queryP?: string;
  queryQP?: string;
  fs?: string;
  fr?: string;
  ac?: AutoComplete | null;

  get hash(): string {
    return [this.query, this.queryP, this.queryQP, this.fs, this.fr].map(x => x || '').join('|');
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

  DrawerState = DrawerState;
  drawerState = DrawerState.Half;
  filtersVisible: boolean | null = null;
  
  searchParamsCalc = new Subject<SearchParamCalc>(); 
  currentSearchParamCalc: SearchParamCalc = new SearchParamCalc();

  constructor(private route: ActivatedRoute, private api: ApiService, private router: Router) {
    this.searchParamsCalc.pipe(
      untilDestroyed(this),
      debounceTime(100),
      map((spc) => {
        spc.query = spc.queryP || spc.queryQP || '';
        this.query = spc.query;
        return spc;
      }),
      filter(() => this.stage === 'search-results'),
      distinctUntilChanged((x, y) => x.hash.localeCompare(y.hash) === 0),
      switchMap((spc) => {
        console.log('NEW QUERY', spc);
        if (spc.query && spc.query !== '') {
          return this.api.getAutocompleteEntry(spc.query)
            .pipe(
              map((ac) => {
                spc.ac = ac;
                return spc;
              })
            );
        } else {
          return from([])
        }
      }),
    ).subscribe((spc) => {
      console.log('new search params', spc);
      const fs = spc.fs?.split('|').map(x => 'human_situations:' + x) || [];
      const fr = spc.fr?.split('|').map(x => 'human_services:' + x) || [];
      if (spc.ac) {
        this.searchParams = {
          query: null,
          response: spc.ac.response,
          situation: spc.ac.situation,
          filter_situations: fs,
          filter_responses: fr,
        };
      } else {
        this.searchParams = {
          query: this.query,
          response: null,
          situation: null,
          filter_situations: fs,
          filter_responses: fr,
        };
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
      console.log('STAGE', this.stage);
      this.pushSearchParamsCalc();
    });
    route.queryParams.pipe(
      untilDestroyed(this),
    ).subscribe(params => {
      console.log('NEW QUERY PARAMS', params);
      this.currentSearchParamCalc.queryQP = params.q || '';
      this.currentSearchParamCalc.fs = params.fs;
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
    this.drawerState = map[this.drawerState + ':' + drawerEvent] || this.drawerState;
  }

  setSearchParams(searchParams: SearchParams) {
    // this.searchParams = searchParams;
    this.router.navigate([], {
      queryParams: {
        q: this.currentSearchParamCalc.queryQP || null,
        fs: searchParams.filter_situations?.map(x => x.slice('human_situations:'.length)).join('|') || null,
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
}
