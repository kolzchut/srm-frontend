import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { TaxonomyItem } from '../consts';
import { SearchFiltersMoreButtonComponent } from '../search-filters-more-button/search-filters-more-button.component';
import { FiltersState } from '../search-filters/filters-state';

@Component({
  selector: 'app-search-filters-situation-section',
  templateUrl: './search-filters-situation-section.component.html',
  styleUrls: ['./search-filters-situation-section.component.less']
})
export class SearchFiltersSituationSectionComponent implements OnInit {

  NUM_SITUATIONS = 6;

  @Input() situations: TaxonomyItem[] | null = null;
  @Input() title: string;
  @Input() field: string;
  @Input() filtersState: FiltersState;

  @ViewChild('moreSituations') moreSituations: SearchFiltersMoreButtonComponent;

  _situations: TaxonomyItem[] = [];
  num_situations = this.NUM_SITUATIONS;

  constructor() { }

  ngOnInit(): void {
    this._situations = [];
    this.num_situations = this.NUM_SITUATIONS;
    const current = this.searchParams[this.field] || [];
    for (let situation of this.situations || []) {
      if (situation.id && current.indexOf(situation.id) >= 0) {
        this._situations.push(situation);
        this.num_situations++;
      }
    }
    for (let situation of this.situations || []) {
      if (situation.id && current.indexOf(situation.id) < 0) {
        this._situations.push(situation);
      }
    }
  }

  changed() {
    this.filtersState.pushSearchParams();
  }

  toggled(checked: boolean, item: TaxonomyItem) {
    const sp = this.filtersState.currentSearchParams as any;
    let sits: string[] = sp[this.field] || [];
    sits = sits.filter(x => x !== item.id);
    if (checked && item.id) {
      sits.push(item.id);
    }
    sp[this.field] = sits;
    if (item?.id) {
      this.filtersState.touchSituation(item.id);
    }
    this.changed();
  }

  get searchParams() {
    return this.filtersState.currentSearchParams as any;
  }

  removeDuplicates(list:TaxonomyItem[]) {
    const uniqueItems = [];
    const seenKeys = new Set();
  
    for (const item of list) {
      if (!seenKeys.has(item.id)) {
        seenKeys.add(item.id);
        uniqueItems.push(item);
      }
    }
    return uniqueItems;
  }
}
