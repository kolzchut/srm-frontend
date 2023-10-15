import { Params, Router } from "@angular/router";
import { ApiService } from "../api.service";
import { Subject, debounceTime, switchMap, timer } from "rxjs";
import { _h, prepareQuery } from "../consts";
import { untilDestroyed } from "@ngneat/until-destroy";
import { PlatformService } from "../platform.service";
import { Component } from "@angular/core";

export type ResultType = {
  link: string[] | string | null,
  linkParams?: Params,
  display: string,
  query: string | null,
  direct: boolean,
};


export class SearchConfig {
  query_ = '';
  noResults = false;
  inputEl: HTMLInputElement | null = null;

  autoCompleteResults: ResultType[] = [];
  topCards: ResultType[] = [];
  presets: ResultType[] = [];
  results_: ResultType[] | null = null;

  queries = new Subject<string>();
  typedQueries = new Subject<string>();

  autoFocus = true;

  constructor(private container: any, private router: Router, private api: ApiService, private platform: PlatformService) {
    api.getPresets().subscribe(presets => {
      console.table(presets);
      this.presets = [{
        link: ['/s', 'שירותים_למצב_החירום'],
        display: '<span class="emergency">שירותים למצב החירום המלחמתי</span>',
        query: 'שירותים למצב החירום',
        direct: false,
      }, ...presets.map((preset) => {
        return {
          link: ['/s', prepareQuery(preset.title)],
          display: `<em>${preset.title}</em>`,
          query: preset.title,
          direct: false,
        };
      })];
    });
    this.typedQueries.pipe(
      untilDestroyed(this.container),
      debounceTime(this.platform.browser() ? 500 : 0),
    ).subscribe((query) => {
      this.queries.next(query);
    });
    this.queries.pipe(
      untilDestroyed(this.container),
      switchMap(query => api.getAutoComplete(query)),
    ).subscribe(results => {
      this.autoCompleteResults = results.map((result) => {
        return {
          link: ['/s', result.id],
          display: _h(result, 'query'),
          query: result.query,
          direct: false,
        };
      });
      this.noResults = this.autoCompleteResults.length === 0;
      this.results_ = null;
    });
    this.queries.pipe(
      untilDestroyed(this.container),
      switchMap(query => api.getTopCards(query)),
    ).subscribe(results => {
      this.topCards = results.map((result) => {
        let display = _h(result, 'service_name');
        if (result.branch_name) {
          display += ` (${_h(result, 'branch_name')})`;
        }
        return {
          link: ['/c', result.card_id],
          display,
          query: null,
          direct: true,
        };
      });
      this.results_ = null;
    });
  }

  get query() {
    return this.query_;
  }

  set query(query: string) {
    if (this.query_ === '' && query) {
      this.inputEl?.focus();
    }
    this.query_ = query;
    this.noResults = false;
    this.queries.next(query);
  }

  setInputEl(el: HTMLInputElement) {
    if (this.query_) {
      el.setSelectionRange(0, this.query_.length);
    }
    if (this.autoFocus) {
      el.focus();
    }
    this.inputEl = el;
  }

  focus() {
    this.inputEl?.focus();
  }

  blur() {
    this.inputEl?.blur();
  }

  changed(event: KeyboardEvent) {
    if (event.key === 'Enter' && this.query?.length > 0) {
      let found = false;
      for (const result of this.autoCompleteResults) {
        if (result.query === this.query.trim()) {
          this.router.navigate(result.link as string[], {queryParams: result.linkParams});
          found = true;
          break;
        }
      }
      if (!found) {
        this.router.navigate(['/s', '_'], {queryParams: {q: prepareQuery(this.query)}});
      }
    }
  }

  get results(): ResultType[] {
    if (this.results_ === null) {
      // console.table('RESULTS', this.autoCompleteResults, this.topCards);
      this.results_ = [
        ...this.autoCompleteResults.slice(0, 5 - this.topCards.length),
        ...this.topCards
      ];
      this.results_ = [
        ...this.results_.filter(r => r.query !== this.query),
        ...this.results_.filter(r => r.query === this.query)
      ];
      const lastPart = this.query.split(' ').slice(-1)[0];
      this.results_.forEach((r) => {
        r.display = r.display.replace(new RegExp(`^(${lastPart})`), '<em>$1</em>');
        r.display = r.display.replace(new RegExp(`(\\s${lastPart})`), '<em>$1</em>');
      });
      if (this.noResults && this.query?.length > 0) {
        this.results_.push({
          link: ['/s', '_'],
          linkParams: {q: prepareQuery(this.query)},
          display: `<em>${this.query}</em>`,
          query: null,
          direct: true,
        });
      }
    }
    return this.results_;
  }
}