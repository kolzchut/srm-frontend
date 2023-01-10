import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-desktop-menu-links',
  templateUrl: './desktop-menu-links.component.html',
  styleUrls: ['./desktop-menu-links.component.less'],
  host: {
    'class': 'layout-desktop'
  }
})
export class DesktopMenuLinksComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
