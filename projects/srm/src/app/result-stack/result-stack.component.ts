import { Component, Input, OnInit } from '@angular/core';
import { Card } from '../consts';

@Component({
  selector: 'app-result-stack',
  templateUrl: './result-stack.component.html',
  styleUrls: ['./result-stack.component.less'],
})
export class ResultStackComponent implements OnInit {

  @Input() result: Card;

  constructor() { }

  ngOnInit(): void {
  }

  get collapsible() {
    return (this.result?._collapse_count || 0) > 0;
  }

  get collapsibleCount() {
    const c = (this.result?._collapse_count || 0);
    return c > 10 ? 10 : c;
  }
}
