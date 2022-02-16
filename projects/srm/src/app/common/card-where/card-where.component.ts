import { Component, Input, OnInit } from '@angular/core';
import { getResponseCategoryColor, getResponseIdColor } from '../consts';
import { Card } from '../datatypes';

@Component({
  selector: 'app-card-where',
  templateUrl: './card-where.component.html',
  styleUrls: ['./card-where.component.less']
})
export class CardWhereComponent implements OnInit {

  @Input() card: Card;
  @Input() big = false;
  
  constructor() { }

  ngOnInit(): void {
  }

  get categoryColor() {
    return this.card.response_category ? getResponseCategoryColor(this.card.response_category) : getResponseIdColor(this.card.responses[0].id);
  }
}
