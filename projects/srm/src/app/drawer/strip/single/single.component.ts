import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Card } from '../../../common/datatypes';

@Component({
  selector: 'app-strip-single',
  templateUrl: './single.component.html',
  styleUrls: ['./single.component.less']
})
export class SingleComponent implements OnInit {

  @Input() service: Card;
  @Output() selected = new EventEmitter<Card>();
  @Output() closed = new EventEmitter<void>();

  constructor() { }

  ngOnInit(): void {
  }

}
