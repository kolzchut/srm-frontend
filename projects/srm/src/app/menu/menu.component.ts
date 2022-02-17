import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { timer } from 'rxjs';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.less'],
  host: {
    '[class.enter]': 'active && init',
    '[class.exit]': '!active && !info && init',
    '[class.exit-info]': '!active && !!info && init',
  }
})
export class MenuComponent implements OnInit {

  @Input() active = false;
  @Output() close = new EventEmitter<string | null>();

  info = false;
  init = false;

  logoUrls: string[] = [
    'assets/img/logo-kolzchut.svg',
    'assets/img/logo-moj.svg',
    'assets/img/logo-digital.svg',
  ];

  constructor() { }

  ngOnInit(): void {
  }

  ngOnChanges() {
    if (this.active) {
      this.info = false;
      this.init = true;
    }
  }

  closeMe(selection: string | null) {
    this.info = !!selection;
    this.close.emit(selection);
  }
}
