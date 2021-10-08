import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Card } from '../../../common/datatypes';

@Component({
  selector: 'app-strip-multiple',
  templateUrl: './strip-multiple.component.html',
  styleUrls: ['./strip-multiple.component.less']
})
export class StripMultipleComponent implements OnInit {

  @Input() services: Card[];
  @Output() selected = new EventEmitter<Card>();

  constructor() { }

  ngOnInit(): void {
  }

}
