import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { switchMap, tap } from 'rxjs/operators';
import { getResponseColor } from '../../common/consts';
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
export class FilterBarComponent implements OnInit {

  @Input() forceOpaque: boolean = false;
  @Output() activated = new EventEmitter<string | null>();

  _active: boolean = false;

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
        this.responseColor = getResponseColor(this.responseFilter.id) + 'c0';
      } else {
        this.responseFilter = null;
      }
    });

  }

  ngOnInit(): void {
  }

  set active(value: boolean) {
    this._active = value;
    this.activated.next(value ? 'filters': null);
  }

  get active(): boolean {
    return this._active;
  }

  get materialized(): boolean {
    return this.forceOpaque || this.situations.isActive() || this.layout.desktop || !!this.responseFilter;
  }
}
