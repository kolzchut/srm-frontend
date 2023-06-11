import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { SeoSocialShareService } from 'ngx-seo';
import { A11yService } from '../../../a11y.service';

@Component({
  selector: 'app-menu-popup-contact',
  templateUrl: './menu-popup-contact.component.html',
  styleUrls: ['./menu-popup-contact.component.less']
})
export class MenuPopupContactComponent implements OnInit, AfterViewInit {

  constructor(private seo: SeoSocialShareService, private a11y: A11yService, @Inject(DOCUMENT) private document: any) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
      this.a11y.setSeoTitle('צרו קשר | כל שירות');
      this.seo.setUrl(this.document.location.href);
  }
}

