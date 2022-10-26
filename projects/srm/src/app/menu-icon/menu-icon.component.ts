import { Component, OnInit } from '@angular/core';
import { MenuService } from '../menu/menu.component';

@Component({
  selector: 'app-menu-icon',
  templateUrl: './menu-icon.component.html',
  styleUrls: ['./menu-icon.component.less']
})
export class MenuIconComponent implements OnInit {

  constructor(public menu: MenuService) { }

  ngOnInit(): void {
  }

}
