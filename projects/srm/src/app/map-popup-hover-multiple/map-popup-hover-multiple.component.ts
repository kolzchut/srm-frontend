import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-map-popup-hover-multiple',
  templateUrl: './map-popup-hover-multiple.component.html',
  styleUrls: ['./map-popup-hover-multiple.component.less'],
  host: {
    '(click)': 'clicked.emit()'
  }
})
export class MapPopupHoverMultipleComponent implements OnInit {

  @Input() props: any;
  @Output() clicked = new EventEmitter<void>();

  constructor() { }

  ngOnInit(): void {
  }

}
