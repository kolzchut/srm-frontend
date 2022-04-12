import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { HighlighterService } from '../../../highlighter.service';
import { StateService } from '../../../state.service';


// import { LngLatBounds } from 'mapbox-gl';
declare var mapboxgl: any;
@Component({
  selector: 'app-autocomplete-result',
  templateUrl: './autocomplete-result.component.html',
  styleUrls: ['./autocomplete-result.component.less'],
  host: {
    '(click)': 'click()'
  }
})
export class AutocompleteResultComponent implements OnInit {

  @Input() type: string;
  @Input() result: any;
  @Output() selected = new EventEmitter();

  constructor(private state: StateService, private highlighter: HighlighterService) { }

  ngOnInit(): void {
  }

  click(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (this.type === 'places') {
      const bounds = new mapboxgl.LngLatBounds(this.result.bounds);
      this.state.placeName = this.result.name[0];
      this.state.bounds = bounds;
    } else if (this.type === 'responses') {
      this.state.responseFilter = this.result.id;
    } else if (this.type === 'orgs') {
      this.state.orgFilter = this.result;
      this.state.orgId = this.result.id;
    } else if (this.type === 'cards') {
      this.state.responseFilter = null;
      this.state.card = this.result;
    }
    this.selected.emit();
    return false;
  }

  highlight(text: string) {
    return this.highlighter.highlight(text);
  }
}
