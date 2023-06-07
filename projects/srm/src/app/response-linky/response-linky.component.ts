import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { TaxonomyItem, prepareQuery } from '../consts';
import { ResponseBase } from '../response/response-base';

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

  constructor() {
    super();
  }

  ngOnChanges(): void {
    this.initColors(this.response);
    this.recalcColors();
  }

  get responseQuery() {
    return prepareQuery(this.response.name || '');
  }
}
