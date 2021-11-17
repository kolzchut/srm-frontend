import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { timer } from 'rxjs';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.less'],
  host: {
    '[class.exit]': 'exit',
  }
})
export class MenuComponent implements OnInit {

  @Output() close = new EventEmitter<string | null>();

  exit = false;

  logoUrls: string[] = [
    'assets/img/logo-kolzchut.svg',
    'assets/img/logo-moj.svg',
    'assets/img/logo-digital.svg',
  ];

  constructor() { }

  ngOnInit(): void {
  }

  closeMe(selection: string | null) {
    this.exit = true;
    timer(300).subscribe(() => this.close.emit(selection));
  }
}
