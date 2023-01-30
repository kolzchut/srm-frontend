import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { SeoSocialShareService } from 'ngx-seo';

@Component({
  selector: 'app-menu-popup-about',
  templateUrl: './menu-popup-about.component.html',
  styleUrls: ['./menu-popup-about.component.less']
})
export class MenuPopupAboutComponent implements OnInit, AfterViewInit {

  constructor(private seo: SeoSocialShareService, @Inject(DOCUMENT) private document: any) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
      this.seo.setTitle('אודות כל שירות | כל שירות');
      this.seo.setUrl(this.document.location.href);
  }
}
