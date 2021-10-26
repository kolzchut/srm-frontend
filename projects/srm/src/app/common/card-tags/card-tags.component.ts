import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { getResponseColor } from '../consts';
import { Card, CategoryCountsResult } from '../datatypes';

@Component({
  selector: 'app-card-tags',
  templateUrl: './card-tags.component.html',
  styleUrls: ['./card-tags.component.less']
})
export class CardTagsComponent implements OnInit, OnChanges {

  @Input() item: Card;
  @Input() big = false;
  
  chips: CategoryCountsResult[] = [];

  constructor() { }

  ngOnInit(): void {
  }

  ngOnChanges() {
    if (this.item && this.item.responses) {
      this.chips = [
        // {
        //   display: 'סוג המענה',
        //   color: getResponseColor(this.item.responses[0].id),
        // },
        ...this.item.responses.map((r: any) => {
            return {
              id: r.id,
              display: r.name,
              category: r.id.split(':')[1],
              color: getResponseColor(r.id),
            };
        })      
      ];
    }
  }
}
