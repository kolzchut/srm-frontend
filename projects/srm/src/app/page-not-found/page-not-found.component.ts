import { Component, Inject, OnInit, Optional } from '@angular/core';
import { REQUEST } from '@nguniversal/express-engine/tokens';
import { PlatformService } from '../platform.service';
import { Request } from 'express';

@Component({
  selector: 'app-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.less']
})
export class PageNotFoundComponent implements OnInit {

  src = '';

  constructor(
    private platform: PlatformService,
    @Optional() @Inject(REQUEST) private request: Request
  ) {}

  ngOnInit(): void {
    this.platform.server(() => {
      if (this.request.res) {
        this.request.res.status(404);
      }
    });
    this.platform.browser(() => {
      this.src = 'assets/img/404/' + Math.ceil(Math.random()*4) + '.png';
    });
  }

}
