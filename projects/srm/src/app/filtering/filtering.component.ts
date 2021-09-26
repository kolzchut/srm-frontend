import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-filtering',
  templateUrl: './filtering.component.html',
  styleUrls: ['./filtering.component.less'],
  host: {
    '[class.active]': '!!this.activeSection'
  }
})
export class FilteringComponent implements OnInit {

  @Output() activated = new EventEmitter<boolean>();

  activeSection: string | null = null;

  constructor() { }

  ngOnInit(): void {
  }

  set active(value: string | null) {
    this.activeSection = value;
    this.activated.next(!!value);
  }

}
