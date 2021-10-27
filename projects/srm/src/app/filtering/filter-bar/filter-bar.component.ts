import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SituationsService } from '../../situations.service';

@Component({
  selector: 'app-filter-bar',
  templateUrl: './filter-bar.component.html',
  styleUrls: ['./filter-bar.component.less']
})
export class FilterBarComponent implements OnInit {

  @Input() forceOpaque: boolean = false;
  @Output() activated = new EventEmitter<string | null>();

  _active: boolean = false;

  constructor(public situations: SituationsService) { }

  ngOnInit(): void {
  }

  set active(value: boolean) {
    this._active = value;
    this.activated.next(value ? 'filters': null);
  }

  get active(): boolean {
    return this._active;
  }
}
