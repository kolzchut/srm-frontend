import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-filter-bar',
  templateUrl: './filter-bar.component.html',
  styleUrls: ['./filter-bar.component.less']
})
export class FilterBarComponent implements OnInit {

  @Input() forceOpaque: boolean = false;
  @Output() activated = new EventEmitter<string | null>();

  constructor() { }

  ngOnInit(): void {
  }

  set active(value: boolean) {
    this.activated.next(value ? 'filters': null);
  }
}
