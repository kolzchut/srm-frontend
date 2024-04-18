import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { SeoSocialShareService } from 'ngx-seo';
import { A11yService } from '../../../a11y.service';
import { ApiService } from '../../../api.service';
import { AutoComplete } from '../../../consts';

@Component({
  selector: 'app-menu-popup-index',
  templateUrl: './menu-popup-index.component.html',
  styleUrls: ['./menu-popup-index.component.less']
})
export class MenuPopupIndexComponent implements OnInit, AfterViewInit {
  responses: AutoComplete[] = [];
  situations: AutoComplete[] = [];

  constructor(private api: ApiService, private seo: SeoSocialShareService, private a11y: A11yService, @Inject(DOCUMENT) private document: any) { }

  ngOnInit(): void {
    this.api.getIndexResponses().subscribe((responses) => {
      this.responses = responses;
      console.log(this.responses);
    });
    this.api.getIndexSituations().subscribe((situations) => {
      this.situations = situations;
    });
  }

  ngAfterViewInit(): void {
      this.a11y.setSeoTitle('מפת אתר | כל שירות');
      this.seo.setUrl(this.document.location.href);
  }
}
