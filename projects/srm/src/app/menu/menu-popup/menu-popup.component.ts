import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { timer } from 'rxjs';

@Component({
  selector: 'app-menu-popup',
  templateUrl: './menu-popup.component.html',
  styleUrls: ['./menu-popup.component.less'],
  host: {
    '[class.active]': 'active === true',
    '[class.inactive]': 'active === false',
    '[class.enter]': 'state === "enter"',
    '[class.exit]': 'state === "exit"',
  }
})
export class MenuPopupComponent implements OnInit {

  _active = false;
  state = '';

  get active(): boolean {
    return this._active;
  }
  @Input() set active(value: boolean) {
    if (value !== this._active) {
      if (value) {
        this.state = 'enter';
      } else {
        this.state = 'exit';
      }
      timer(300).subscribe(() => { this.state = ''; });
    }
    this._active = value;
  }
  @Output() close = new EventEmitter<void>();

  constructor() { }

  ngOnInit(): void {
  }

  closeMe() {
    this.close.emit();
  }
}
