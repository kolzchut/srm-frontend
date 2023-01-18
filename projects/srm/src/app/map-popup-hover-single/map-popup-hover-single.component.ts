import { Component, Input, OnChanges } from '@angular/core';
import { ApiService } from '../api.service';
import { Card } from '../consts';

@Component({
  selector: 'app-map-popup-hover-single',
  templateUrl: './map-popup-hover-single.component.html',
  styleUrls: ['./map-popup-hover-single.component.less']
})
export class MapPopupHoverSingleComponent {

  @Input() card: Card | null;

  constructor() { }
}
