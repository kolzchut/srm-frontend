import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { SeoSocialShareService } from 'ngx-seo';
import { A11yService } from '../../../a11y.service';

@Component({
  selector: 'app-menu-popup-partners',
  templateUrl: './menu-popup-partners.component.html',
  styleUrls: ['./menu-popup-partners.component.less']
})
export class MenuPopupPartnersComponent implements OnInit, AfterViewInit {

  constructor(private seo: SeoSocialShareService, private a11y: A11yService,
    @Inject(DOCUMENT) private document: any) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
      this.a11y.setSeoTitle('שותפים בכל שירות | כל שירות');
      this.seo.setUrl(this.document.location.href);
  }
}

