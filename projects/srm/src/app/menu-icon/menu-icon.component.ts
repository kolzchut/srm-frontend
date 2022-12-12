import { Component, Input, OnInit } from '@angular/core';
import { MenuService } from '../menu/menu.component';

@Component({
  selector: 'app-menu-icon',
  templateUrl: './menu-icon.component.html',
  styleUrls: ['./menu-icon.component.less']
})
export class MenuIconComponent implements OnInit {

  @Input() dark = false;

  constructor(public menu: MenuService) { }

  ngOnInit(): void {
  }

}
