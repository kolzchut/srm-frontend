import { Component, Input, OnInit } from '@angular/core';
import { SearchConfig } from '../search-config';

@Component({
  selector: 'app-autocomplete-results',
  templateUrl: './autocomplete-results.component.html',
  styleUrls: ['./autocomplete-results.component.less'],
  host: {
    'role': 'list'
  }
})
export class AutocompleteResultsComponent implements OnInit {

  @Input() config: SearchConfig;

  constructor() { }

  ngOnInit(): void {
  }

}
