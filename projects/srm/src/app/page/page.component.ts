import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { from, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { AutoComplete, DrawerState, SearchParams } from '../consts';

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
  queryP_ = '';
  queryQP_ = '';
  searchParams: SearchParams;

  DrawerState = DrawerState;
  drawerState = DrawerState.Half;
  
  searchParamsCalc = new Subject(); 

  constructor(private route: ActivatedRoute, private api: ApiService) {
    this.searchParamsCalc.pipe(
      debounceTime(100),
      map(() => {
        this.query = this.queryP_ || this.queryQP_ || '';
        return this.query;
      }),
      filter(() => this.stage === 'search-results'),
      distinctUntilChanged(),
      switchMap((query) => {
        console.log('NEW QUERY', query);
        if (query !== '') {
          return this.api.getAutocompleteEntry(query);
        } else {
          return from([])
        }
      }),
    ).subscribe((res: AutoComplete | null) => {
      console.log('new search params', res);
      if (res) {
        this.searchParams = {
          query: null,
          response: res.response,
          situation: res.situation,
        };
      } else {
        this.searchParams = {
          query: this.query,
          response: null,
          situation: null,
        };
      }
    });
    route.params.subscribe(params => {
      this.card = params.card || '';
      this.point = params.point || '';
      this.queryP_ = params.query || '';
      this.searchParamsCalc.next();
    });
    route.data.subscribe(data => {
      this.stage = data.stage;
      this.drawerState = DrawerState.Half;
      console.log('STAGE', this.stage);
      this.searchParamsCalc.next();
    });
    route.queryParams.subscribe(params => {
      this.queryQP_ = params.q || '';
      this.searchParamsCalc.next();
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
}
