import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { Subject, timer } from 'rxjs';
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
  @ViewChild('input') input: ElementRef;

  _active = false;
  _query = '';

  constructor(private search: SearchService, private state: StateService) {
    state.queryChanges.subscribe(state => {
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
    if (value) {
      this.query = this._query;

      timer(10).subscribe(() => {
        const inputEl = this.input?.nativeElement as HTMLInputElement;
        if (inputEl) {
          inputEl.setSelectionRange(0, this.query.length);
        }
      });
    }
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
