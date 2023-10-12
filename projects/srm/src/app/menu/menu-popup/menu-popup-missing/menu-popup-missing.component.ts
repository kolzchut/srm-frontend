import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { SeoSocialShareService } from 'ngx-seo';
import { A11yService } from '../../../a11y.service';

@Component({
  selector: 'app-menu-popup-missing',
  templateUrl: './menu-popup-missing.component.html',
  styleUrls: ['./menu-popup-missing.component.less']
})
export class MenuPopupMissingComponent implements OnInit {

  constructor(private seo: SeoSocialShareService, private a11y: A11yService,
    @Inject(DOCUMENT) private document: any) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
      this.a11y.setSeoTitle('הוסיפו שירות חסר | כל שירות');
      this.seo.setUrl(this.document.location.href);
  }
}
