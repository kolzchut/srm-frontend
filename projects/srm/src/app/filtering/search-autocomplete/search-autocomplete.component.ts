import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-search-autocomplete',
  templateUrl: './search-autocomplete.component.html',
  styleUrls: ['./search-autocomplete.component.less']
})
export class SearchAutocompleteComponent implements OnInit {

  @Input() intersectionObserver: IntersectionObserver;
  @Output() selected = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }

}
