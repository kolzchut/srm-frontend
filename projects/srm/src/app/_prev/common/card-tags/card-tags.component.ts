import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { StateService } from '../../../state.service';
import { getResponseIdColor } from '../../../colors';
import { Card, CategoryCountsResult } from '../datatypes';

@Component({
  selector: 'app-card-tags',
  templateUrl: './card-tags.component.html',
  styleUrls: ['./card-tags.component.less']
})
export class CardTagsComponent implements OnInit, OnChanges {

  @Input() card: Card;
  @Input() big = false;
  
  chips: CategoryCountsResult[] = [];

  constructor(private state: StateService) { }

  ngOnInit(): void {
  }

  ngOnChanges() {
    const responseFilter = this.state._state.responseId || 'nonexistent';
    if (this.card && this.card.responses) {
      this.chips = this.card.responses.map((r: any) => {
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
