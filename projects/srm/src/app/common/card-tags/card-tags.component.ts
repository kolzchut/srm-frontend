import { Component, Input, OnInit } from '@angular/core';
import { getResponseColor } from '../consts';
import { Card, CategoryCountsResult } from '../datatypes';

@Component({
  selector: 'app-card-tags',
  templateUrl: './card-tags.component.html',
  styleUrls: ['./card-tags.component.less']
})
export class CardTagsComponent implements OnInit {

  @Input() item: Card;
  @Input() big = false;
  
  constructor() { }

  ngOnInit(): void {
  }

  get chips(): CategoryCountsResult[] {
    if (!this.item || !this.item.responses) {
      return [];
    }
    return [
      // {
      //   display: 'סוג המענה',
      //   color: getResponseColor(this.item.responses[0].id),
      // },
      ...this.item.responses.map((r: any) => {
          return {
            display: r.name,
            color: getResponseColor(r.id),
          };
      })      
    ];
  }
}
