import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { from, Subject } from 'rxjs';
import { debounceTime, map, switchMap } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { AutoComplete, DrawerState } from '../consts';

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
  searchQuery: string | null = null;
  searchResponse: string | null = null;
  searchSituation: string | null = null;
  drawerState = DrawerState.Half;
  
  searchParamsCalc = new Subject(); 

  constructor(private route: ActivatedRoute, private api: ApiService) {
    this.searchParamsCalc.pipe(
      debounceTime(100),
      map(() => {
        this.query = this.queryP_ || this.queryQP_ || '';
        return this.query;
      }),
      switchMap((query) => {
        if (query !== '') {
          return this.api.getAutocompleteEntry(query);
        } else {
          return from([])
        }
      }),
    ).subscribe((res: AutoComplete | null) => {
      console.log('new search params', res);
      if (res) {
        this.searchQuery = null;
        this.searchResponse = res.response;
        this.searchSituation = res.situation;
      } else {
        this.searchQuery = this.query;
        this.searchResponse = null;
        this.searchSituation = null;
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
      console.log('STAGE', this.stage);
    });
    route.queryParams.subscribe(params => {
      this.queryQP_ = params.q || '';
      this.searchParamsCalc.next();
    });
  }

  ngOnInit(): void {
  }
}
