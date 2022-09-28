import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-filter-button',
  templateUrl: './filter-button.component.html',
  styleUrls: ['./filter-button.component.less'],
  host: {
    '[class.materialized]': 'materialized',
    '[class.active]': 'active',
    '(click)': 'clicked.next($event)'
  }
})
export class FilterButtonComponent implements OnInit {

  @Input() materialized = false;
  @Input() active = false;
  @Input() count = 0;

  @Output() clicked = new EventEmitter<Event>();

  constructor() { }

  ngOnInit(): void {
  }
  
}
