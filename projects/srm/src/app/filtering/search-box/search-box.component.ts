import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { StateService } from '../../state.service';

@Component({
  selector: 'app-search-box',
  templateUrl: './search-box.component.html',
  styleUrls: ['./search-box.component.less']
})
export class SearchBoxComponent implements OnInit {

  @Output() activated = new EventEmitter<string | null>();

  _active = false;
  _query = '';

  constructor(private state: StateService) {
    state.state.subscribe((state) => {
      this._query = state.searchQuery || '';
    })
  }

  ngOnInit(): void {
  }

  set active(value: boolean) {
    this._active = value;
    this.activated.next(value ? 'search': null);
  }

  get active() {
    return this._active;
  }

  set query(value: string) {
    this.state.searchQuery = value;
  }

  get query() {
    return this._query;
  }
}
