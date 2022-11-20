import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { switchMap, tap } from 'rxjs/operators';
import { getResponseIdColor } from '../../../colors';
import { Response } from '../../common/datatypes';
import { LayoutService } from '../../layout.service';
import { ResponsesService } from '../../responses.service';
import { SituationsService } from '../../situations.service';
import { StateService } from '../../state.service';

@Component({
  selector: 'app-filter-bar',
  templateUrl: './filter-bar.component.html',
  styleUrls: ['./filter-bar.component.less']
})
export class FilterBarComponent implements OnChanges {

  @Input() active = false;
  @Input() forceOpaque: boolean = false;
  @Output() activated = new EventEmitter<string | null>();

  responseFilter: Response | null = null;
  responseMap: { [key: string]: Response; };
  responseColor: string;

  constructor(public situations: SituationsService, public responses: ResponsesService, public layout: LayoutService, public state: StateService) {
    this.responses.taxonomy.pipe(
      tap((responseMap) => { this.responseMap = responseMap; }),
      switchMap(() => state.state),
    ).subscribe(state => {
      if (state.responseId) {
        this.responseFilter = this.responseMap[state.responseId] || null;
        if (this.responseFilter) {
          this.responseColor = getResponseIdColor(this.responseFilter.id) + 'c0';
        } else {
          console.log('STRANGE RESPONSE ID', state.responseId);
        }
      } else {
        this.responseFilter = null;
      }
    });

  }

  ngOnChanges(): void {
    console.log('FB changed', this.active);
  }

  activate(value: boolean) {
    console.log('ACTIVATE', value);
    this.activated.next(value ? 'filters': null);
  }

  get materialized(): boolean {
    return this.forceOpaque || this.situations.isActive() || this.layout.desktop || !!this.responseFilter;
  }
}
