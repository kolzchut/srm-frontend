import { Component, Input, OnInit } from '@angular/core';
import { Card } from '../datatypes';

@Component({
  selector: 'app-card-where',
  templateUrl: './card-where.component.html',
  styleUrls: ['./card-where.component.less']
})
export class CardWhereComponent implements OnInit {

  @Input() item: Card;
  
  constructor() { }

  ngOnInit(): void {
  }

}
