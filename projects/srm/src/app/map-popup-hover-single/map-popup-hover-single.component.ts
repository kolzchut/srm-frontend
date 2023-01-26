import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ApiService } from '../api.service';
import { Card, SearchParams } from '../consts';
import { CardRoute } from '../map-popup-stable/map-popup-stable.component';

@Component({
  selector: 'app-map-popup-hover-single',
  templateUrl: './map-popup-hover-single.component.html',
  styleUrls: ['./map-popup-hover-single.component.less']
})
export class MapPopupHoverSingleComponent implements OnChanges {

  cardRouter = new CardRoute();

  @Input() card: Card | null;
  @Input() searchParams: SearchParams | null;

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
      this.cardRouter.searchParams = this.searchParams;
  }
}
