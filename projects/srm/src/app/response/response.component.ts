import { Component, Input, OnInit } from '@angular/core';
import { TaxonomyItem } from '../consts';

@Component({
  selector: 'app-response',
  templateUrl: './response.component.html',
  styleUrls: ['./response.component.less']
})
export class ResponseComponent implements OnInit {

  @Input() response: TaxonomyItem = {};
  @Input() link = true;

  constructor() { }

  ngOnInit(): void {
  }

}
