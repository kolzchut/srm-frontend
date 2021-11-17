import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.less']
})
export class MenuComponent implements OnInit {

  @Output() close = new EventEmitter<string | null>();

  logoUrls: string[] = [
    'assets/img/logo-kolzchut.svg',
    'assets/img/logo-moj.svg',
    'assets/img/logo-digital.svg',
  ];

  constructor() { }

  ngOnInit(): void {
  }

}
