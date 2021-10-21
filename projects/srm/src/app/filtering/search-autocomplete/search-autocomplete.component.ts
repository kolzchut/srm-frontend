import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-search-autocomplete',
  templateUrl: './search-autocomplete.component.html',
  styleUrls: ['./search-autocomplete.component.less']
})
export class SearchAutocompleteComponent implements OnInit {

  @Output() selected = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }

}
