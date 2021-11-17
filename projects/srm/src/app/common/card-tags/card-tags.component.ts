import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { ResponsesService } from '../../responses.service';
import { StateService } from '../../state.service';
import { getResponseIdColor } from '../consts';
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

  constructor(private state: StateService) { }

  ngOnInit(): void {
  }

  ngOnChanges() {
    const responseFilter = this.state._state.responseId || 'nonexistent';
    if (this.item && this.item.responses) {
      this.chips = this.item.responses.map((r: any) => {
          return {
            id: r.id,
            display: r.name,
            category: r.id.split(':')[1],
            color: getResponseIdColor(r.id),
          };
      });
      this.chips = [
        ...this.chips.filter((c) => c.id.indexOf(responseFilter) === 0),
        ...this.chips.filter((c) => c.id.indexOf(responseFilter) !== 0),
      ];
    }
  }
}
