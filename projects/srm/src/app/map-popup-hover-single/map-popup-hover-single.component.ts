import { Component, Input, OnChanges } from '@angular/core';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-map-popup-hover-single',
  templateUrl: './map-popup-hover-single.component.html',
  styleUrls: ['./map-popup-hover-single.component.less']
})
export class MapPopupHoverSingleComponent implements OnChanges {

  @Input() props: any;

  card: any | null = null;

  constructor(private api: ApiService) { }

  ngOnChanges(): void {
    console.log('HOVER SINGLE', this.props);
    if (this.props && this.props.card) {
      this.card = this.props.card;
    }
  }

}
