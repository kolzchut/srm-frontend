import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { SearchResult } from '../../../common/datatypes';
import { SearchService } from '../../../search.service';

@Component({
  selector: 'app-autocomplete-section',
  templateUrl: './autocomplete-section.component.html',
  styleUrls: ['./autocomplete-section.component.less']
})
export class AutocompleteSectionComponent implements OnInit {

  PREVIEW = 3;

  @Input() type: string;
  @Input() typeName: string;
  @Output() selected = new EventEmitter();

  visible = false;
  count = 0;
  show = this.PREVIEW;

  results: any[] = [];

  constructor(private search: SearchService) {
  }

  ngOnInit(): void {
    const obs = {
      response: this.search.responses,
      place: this.search.places,
      service: this.search.services,
    }[this.type] as Observable<SearchResult<any>>;
    obs.subscribe(res => {
      if (res.search_results && res.search_results.length > 0) {
        this.visible = true;
        this.results = res.search_results.map((s) => s.source);
        this.count = res.search_counts._current.total_overall;
      } else {
        this.results = [];
        this.count = 0;
        this.visible = false;
      }
    });
  }

}
