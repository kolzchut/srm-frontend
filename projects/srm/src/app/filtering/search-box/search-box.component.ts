import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { Response, Place, Card } from '../../common/datatypes';
import { SearchService } from '../../search.service';
import { StateService } from '../../state.service';

@Component({
  selector: 'app-search-box',
  templateUrl: './search-box.component.html',
  styleUrls: ['./search-box.component.less']
})
export class SearchBoxComponent implements OnInit, OnChanges {

  @Input() isActive: boolean;
  @Output() activated = new EventEmitter<string | null>();

  _active = false;
  _query = '';

  constructor(private search: SearchService, private state: StateService) {
    state.state.subscribe(state => {
      this._query = state.searchBoxTitle || '';
      console.log('NEW QUERY', JSON.stringify(this._query));
    });
  }

  ngOnInit(): void {
  }

  ngOnChanges() {
    if (this.isActive !== this.active) {
      this.active = this.isActive;
    }
  }

  set active(value: boolean) {
    this._active = value;
    this.activated.next(value ? 'search': null);
  }

  get active() {
    return this._active;
  }

  set query(value: string) {
    this._query = value;
    this.search.query.next(value);
  }

  get query() {
    return this._query;
  }
}
