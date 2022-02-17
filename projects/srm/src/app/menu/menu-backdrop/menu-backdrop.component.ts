import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-menu-backdrop',
  templateUrl: './menu-backdrop.component.html',
  styleUrls: ['./menu-backdrop.component.less'],
  host: {
    '[class.active]': 'active',
  }
})
export class MenuBackdropComponent implements OnInit {

  @Input() active = false;

  constructor() { }

  ngOnInit(): void {
  }

}
