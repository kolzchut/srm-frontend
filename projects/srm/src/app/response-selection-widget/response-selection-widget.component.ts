import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { TaxonomyItem } from '../consts';

@Component({
  selector: 'app-response-selection-widget',
  templateUrl: './response-selection-widget.component.html',
  styleUrls: ['./response-selection-widget.component.less']
})
export class ResponseSelectionWidgetComponent implements OnChanges {

  @Input() responses: TaxonomyItem[] = [];
  @Input() selectedResponses: string[] = [];

  @Output() toggle = new EventEmitter<TaxonomyItem>();

  active_: any = {};
  semiactive_: any = {};
  selected_: any = {};
  visible_: any = {};
  delays_: any = {};
  expandable_: any = {};
  expanded_: any = {};

  selectedCategories: any = {};

  constructor() { }

  ngOnChanges(): void {
    this.expanded_ = {};
    this.active_ = {};
    this.semiactive_ = {};
    const changedIds: string[] = [];
    let delay = 0;
    this.responses.forEach(r => {
      const id = r.id;
      if (id) {
        const parts = id.split(':');
        const category = this.category(r);

        // Active responses (i.e. explicitly selected or parent is selected)
        for (const sr of this.selectedResponses) {
          if (id.indexOf(sr) === 0) {
            this.active_[id] = true;
            break;
          }
        }

        // Selected responses (i.e. explicitly selected)
        this.selected_[id] = this.selectedResponses.indexOf(id) >= 0;

        // Visible responses - either selected or root or category is selected
        const prevVisible = this.visible_[id];
        this.visible_[id] = this.selected_[id] || parts.length === 2 || this.selectedCategories[category];
        if (prevVisible !== this.visible_[id]) {
          changedIds.push(id);
        }

        // Expandable are roots or categories which are not active
        if (parts.length < 3) {
          this.expandable_[id] = !this.selectedCategories[category];
        }
        // Iterate parents of response -
        //   Expanded are parents of selected responses or parents of any responses in the selected category
        //   Semiactive are parents of selected responses
        for (let i = 1; i < parts.length - 1; i++) {
          const parent = parts.slice(0, i + 1).join(':');
          if (this.visible_[id] || this.selectedCategories[category]) {
            this.expanded_[parent] = true
          }
          if (this.selected_[id]) {
            this.semiactive_[parent] = true;
          }
        }
      }
    });
    this.delays_ = {};
    changedIds.forEach(id => {
      if (this.visible_[id]) {
        this.delays_[id] = delay;
        delay += 200;
      }
    });
    changedIds.forEach(id => {
      if (!this.visible_[id]) {
        this.delays_[id] = delay;
        delay += 100;
      }
    });
  }

  toggleResponse(response: TaxonomyItem) {
    const category = this.category(response);
    if (!this.isSelected(response)) {
      if (response.id === category &&
          !this.selectedCategories[category] &&
          Object.keys(this.selected_).filter(x => this.selected_[x] && x.indexOf(category) === 0).length > 0) {
        console.log('ONLY SWITCHING CATEGORY');
        this.selectedCategories[category] = true;
        this.ngOnChanges();
        return;
      }
      this.selectedCategories[category] = true;
    } else {
      if (response.id && this.selectedCategories[response.id]) {
        this.selectedCategories[response.id] = false;
      }
    }
    this.toggle.emit(response);
  }

  isSelected(response: TaxonomyItem) {
    return !!response.id && this.selected_[response.id];
  }

  isActive(response: TaxonomyItem) {
    return !!response.id && this.active_[response.id];
  }

  isSemiActive(response: TaxonomyItem) {
    return !!response.id && this.semiactive_[response.id];
  }

  isVisible(response: TaxonomyItem) {
    return !!response.id && this.visible_[response.id];
  }

  isExpandable(response: TaxonomyItem) {
    return !!response.id && this.expandable_[response?.id];
  }

  isExpanded(response: TaxonomyItem) {
    return !!response.id && this.expanded_[response?.id];
  }

  transitionDelay(response: TaxonomyItem) {
    return (!!response.id ? this.delays_[response.id] : 0) || 0;
  }

  category(response: TaxonomyItem) {
    const parts = response.id?.split(':');
    return (parts && parts.length > 1) ? parts[0] + ':' + parts[1] : 'none';
  }
}
