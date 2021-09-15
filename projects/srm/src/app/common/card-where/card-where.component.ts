import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-card-where',
  templateUrl: './card-where.component.html',
  styleUrls: ['./card-where.component.less']
})
export class CardWhereComponent implements OnInit {

  @Input() item: any;
  
  constructor() { }

  ngOnInit(): void {
  }

}
