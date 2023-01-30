import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-search-filters-more-button',
  templateUrl: './search-filters-more-button.component.html',
  styleUrls: ['./search-filters-more-button.component.less']
})
export class SearchFiltersMoreButtonComponent implements OnInit {

  @Input() count = 0;
  @Input() style: string;
  public expanded = false;

  constructor() { }

  ngOnInit(): void {
  }

}
