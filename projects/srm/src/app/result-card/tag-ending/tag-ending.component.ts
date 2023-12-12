import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { TaxonomyItem } from '../../consts';
import { getResponseIdColor } from '../../colors';
import { ResponseBase } from '../../response/response-base';
import { LayoutService } from '../../layout.service';

@Component({
  selector: 'app-tag-ending',
  templateUrl: './tag-ending.component.html',
  styleUrls: ['./tag-ending.component.less'],
  host: {
    '[class.small]': 'smaller',
  }
})
export class TagEndingComponent implements OnChanges {

  @Input() tags: TaxonomyItem[];
  @Input() small = false;
  @Input() count = 0;

  colors: ResponseBase[] = [];

  constructor(private layout: LayoutService) { }

  ngOnChanges(): void {
    this.colors = [];
    this.tags?.forEach(tag => {
      const color = new ResponseBase();
      if (tag.category) {
        color.initColors(tag);
        color.recalcColors();
      } else {
        color.borderColor = '#E1DEDB';
        color.bgColor = '#FFFDF5';
      }
      this.colors.push(color);
    });
  }

  get smaller() {
    return this.small || this.layout.mobile();
  }
}
