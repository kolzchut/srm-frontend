import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { SeoSocialShareService } from 'ngx-seo';

@Component({
  selector: 'app-menu-popup-contact',
  templateUrl: './menu-popup-contact.component.html',
  styleUrls: ['./menu-popup-contact.component.less']
})
export class MenuPopupContactComponent implements OnInit, AfterViewInit {

  constructor(private seo: SeoSocialShareService, @Inject(DOCUMENT) private document: any) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
      this.seo.setTitle('צרו קשר | כל שירות');
      this.seo.setUrl(this.document.location.href);
  }
}

