import { Component, Input, OnInit } from '@angular/core';
import { TaxonomyItem } from '../consts';

@Component({
  selector: 'app-situation',
  templateUrl: './situation.component.html',
  styleUrls: ['./situation.component.less']
})
export class SituationComponent implements OnInit {

  @Input() situation: TaxonomyItem = {};
  @Input() small = false;

  constructor() { }

  ngOnInit(): void {
  }

}
