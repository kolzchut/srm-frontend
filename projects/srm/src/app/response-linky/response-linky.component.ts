import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { TaxonomyItem, prepareQuery } from '../consts';
import { ResponseBase } from '../response/response-base';
import { Router } from '@angular/router';

@Component({
  selector: 'app-response-linky',
  templateUrl: './response-linky.component.html',
  styleUrls: ['./response-linky.component.less']
})
export class ResponseLinkyComponent extends ResponseBase implements OnChanges {

  @Input() response: TaxonomyItem = {};

  @Input() link = true;
  @Input() search = true;
  @Input() small = false;

  responseQuery = '';

  constructor(private router: Router) {
    super();
  }

  ngOnChanges(): void {
    this.initColors(this.response);
    this.recalcColors();
    this.responseQuery = prepareQuery(this.response.name || '');
  }

  doSearch(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.router.navigate(
      this.search ? ['/q'] : ['/s', this.responseQuery], 
      {
        queryParams: this.search ? {q: this.response.name} : {},
        queryParamsHandling: 'merge'
      }
    );
  }
}
