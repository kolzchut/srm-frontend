import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-filter-button',
  templateUrl: './filter-button.component.html',
  styleUrls: ['./filter-button.component.less'],
  host: {
    '(click)': 'clicked.next($event)'
  }
})
export class FilterButtonComponent implements OnInit {

  @Output() clicked = new EventEmitter<Event>();

  constructor() { }

  ngOnInit(): void {
  }
  
}
