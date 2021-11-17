import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { SearchService } from '../../search.service';

@Component({
  selector: 'app-search-autocomplete',
  templateUrl: './search-autocomplete.component.html',
  styleUrls: ['./search-autocomplete.component.less']
})
export class SearchAutocompleteComponent implements OnInit, OnDestroy {

  @Input() intersectionObserver: IntersectionObserver;
  @Output() selected = new EventEmitter();
  querySub: Subscription;
  showPresets = false;

  constructor(private search: SearchService) { }

  ngOnInit(): void {
    this.querySub = this.search.query.subscribe((query) => {
      this.showPresets = !query;
    });
  }

  ngOnDestroy(): void {
    this.querySub.unsubscribe();
  }

}
