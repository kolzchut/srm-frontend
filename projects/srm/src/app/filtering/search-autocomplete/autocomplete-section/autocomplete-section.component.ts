import { Component, Input, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../api.service';
import { StateService } from '../../../state.service';

@Component({
  selector: 'app-autocomplete-section',
  templateUrl: './autocomplete-section.component.html',
  styleUrls: ['./autocomplete-section.component.less']
})
export class AutocompleteSectionComponent implements OnInit {

  @Input() type: string;
  @Input() typeName: string;

  visible = false;
  more = 3;

  results: Observable<any[]>;

  constructor(api: ApiService) {
    this.results = api.searchResults.pipe(
      map((results: any[]) => {
        const filtered = results.filter((result: any) => result.type === this.type);
        this.visible = filtered.length > 0;
        return filtered;
      })
    );
  }

  ngOnInit(): void {
  }

}
