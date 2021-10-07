import { Component, Input, OnInit } from '@angular/core';
import { getResponseColor } from '../consts';
import { Card } from '../datatypes';

@Component({
  selector: 'app-card-what',
  templateUrl: './card-what.component.html',
  styleUrls: ['./card-what.component.less']
})
export class CardWhatComponent implements OnInit {

  @Input() item: Card;
  @Input() big = false;

  constructor() { }

  ngOnInit(): void {
  }

  get categoryColor() {
    return getResponseColor(this.item.responses[0].id);
  }

}
