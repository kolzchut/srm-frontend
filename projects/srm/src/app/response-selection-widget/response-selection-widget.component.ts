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

  selectedCategory = 'none';

  constructor() { }

  ngOnChanges(): void {
    this.delays_ = {};
    this.expanded_ = {};
    this.semiactive_ = {};
    let delay = 0;
    this.responses.forEach(r => {
      const id = r.id;
      if (id) {
        const parts = id.split(':');
        const category = this.category(r);
        this.active_[id] = false;
        for (const sr of this.selectedResponses) {
          if (id.indexOf(sr) === 0) {
            this.active_[id] = true;
            break;
          }
        }    
        this.selected_[id] = this.selectedResponses.indexOf(id) >= 0;
        const prevVisible = this.visible_[id];
        this.visible_[id] = this.selected_[id] || parts.length === 2 || category === this.selectedCategory;
        if (this.visible_[id] !== prevVisible) {
          this.delays_[id] = delay;
          delay += 300;
        }
        if (parts.length > 2) {
          this.expandable_[category] = true;
        }
        for (let i = 1; i < parts.length - 1; i++) {
          const parent = parts.slice(0, i + 1).join(':');
          if (this.visible_[id]) {
            this.expanded_[parent] = true;
          }
          if (this.selected_[id]) {
            this.semiactive_[parent] = true;
          }
        }
      }
    });
  }

  toggleResponse(response: TaxonomyItem) {
    const category = this.category(response);
    if (!this.isSelected(response)) {
      if (response.id === category &&
          this.selectedCategory !== category &&
          Object.keys(this.selected_).filter(x => this.selected_[x] && x.indexOf(category) === 0).length > 0) {
        console.log('ONLY SWITCHING CATEGORY');
        this.selectedCategory = category;
        this.ngOnChanges();
        return;
      }
      this.selectedCategory = category;
    } else {
      if (response.id === this.selectedCategory) {
        this.selectedCategory = 'none';
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
