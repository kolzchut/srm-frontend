import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { Card, SearchParams } from '../consts';

@Component({
  selector: 'app-point-result-stack',
  templateUrl: './point-result-stack.component.html',
  styleUrls: ['./point-result-stack.component.less'],
  host: {
    '[class.multiple]': 'cards?.length>1',
  }
})
export class PointResultStackComponent implements OnChanges {

  @Input() searchParams: SearchParams;
  @Input() cards: Card[] = [];

  branches: Card[][] = [];

  constructor(private api: ApiService) { }

  ngOnChanges(): void {
  }

}
