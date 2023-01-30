import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { TaxonomyItem } from '../consts';
import { SearchFiltersMoreButtonComponent } from '../search-filters-more-button/search-filters-more-button.component';

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
  @Input() searchParams: any;

  @Output() push = new EventEmitter<void>();

  @ViewChild('moreSituations') moreSituations: SearchFiltersMoreButtonComponent;

  constructor() { }

  ngOnInit(): void {
  }

  changed() {
    this.push.emit();
  }

  toggled(checked: boolean, item: TaxonomyItem) {
    let sits: string[] = this.searchParams[this.field] || [];
    sits = sits.filter(x => x !== item.id);
    if (checked && item.id) {
      sits.push(item.id);
    }
    this.searchParams[this.field] = sits;
    this.changed();
  }
}
