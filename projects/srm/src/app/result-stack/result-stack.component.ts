import { Component, Input, OnInit } from '@angular/core';
import { Card } from '../consts';

@Component({
  selector: 'app-result-stack',
  templateUrl: './result-stack.component.html',
  styleUrls: ['./result-stack.component.less']
})
export class ResultStackComponent implements OnInit {

  @Input() results: Card[][] = [[]];

  constructor() { }

  ngOnInit(): void {
  }

}
