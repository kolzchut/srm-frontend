import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-filter-button',
  templateUrl: './filter-button.component.html',
  styleUrls: ['./filter-button.component.less'],
  host: {
    '[class.materialized]': 'materialized',
    '(click)': 'clicked.next($event)'
  }
})
export class FilterButtonComponent implements OnInit {

  @Input() materialized = false;
  @Input() count = 0;

  @Output() clicked = new EventEmitter<Event>();

  constructor() { }

  ngOnInit(): void {
  }
  
}
