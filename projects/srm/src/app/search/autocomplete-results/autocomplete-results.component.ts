import { Component, Input, OnInit } from '@angular/core';
import { ResultType, SearchConfig } from '../search-config';
import { Router } from '@angular/router';
import { SearchService } from '../../search.service';

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

  constructor(private router: Router, private searchSvc: SearchService) { }

  ngOnInit(): void {
  }

  navigateResult(result: ResultType, event: Event) {
    event.preventDefault();
    if (result.link) {
      this.searchSvc.search(null);
      this.router.navigate(result.link, {queryParams: result.linkParams});
    }
  }
}
