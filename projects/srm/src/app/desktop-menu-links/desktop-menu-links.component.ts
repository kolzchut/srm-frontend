import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-desktop-menu-links',
  templateUrl: './desktop-menu-links.component.html',
  styleUrls: ['./desktop-menu-links.component.less'],
  host: {
    '[class.layout-desktop]': '!footer',
    '[class.footer]': 'footer',
    '[class.homepage]': 'homepage',
  }
})
export class DesktopMenuLinksComponent implements OnInit {

  @Input() footer = false;
  @Input() homepage = false;

  constructor() { }

  ngOnInit(): void {
  }

}
