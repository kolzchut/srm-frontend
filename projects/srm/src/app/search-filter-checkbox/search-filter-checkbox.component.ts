import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TaxonomyItem } from '../consts';

@Component({
  selector: 'app-search-filter-checkbox',
  templateUrl: './search-filter-checkbox.component.html',
  styleUrls: ['./search-filter-checkbox.component.less']
})
export class SearchFilterCheckboxComponent implements OnInit {

  @Input() item: TaxonomyItem;
  @Input() current: string[] = [];
  @Output() changed = new EventEmitter<boolean>();

  constructor() { }

  ngOnInit(): void {
  }

  get checked(): boolean {
    return !!this.item.id && this.current.indexOf(this.item.id) !== -1;
  }
  
  set checked(value: boolean) {
    this.changed.emit(value);
  }
}
