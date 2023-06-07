import { Component, Input, OnInit } from '@angular/core';
import { TaxonomyItem } from '../consts';

@Component({
  selector: 'app-response-selection-widget',
  templateUrl: './response-selection-widget.component.html',
  styleUrls: ['./response-selection-widget.component.less']
})
export class ResponseSelectionWidgetComponent implements OnInit {

  @Input() responses: TaxonomyItem[] = [];
  @Input() selectedResponseId: string | null = null;

  constructor() { }

  ngOnInit(): void {
  }

  toggleResponse(response: TaxonomyItem) {
    if (response.id === this.selectedResponseId) {
      this.selectedResponseId = null;
    } else {
      this.selectedResponseId = response.id || null;
    }
  }

}
