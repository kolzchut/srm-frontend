import { Component, Input, OnInit } from '@angular/core';
import { Card } from '../consts';
import { LayoutService } from '../layout.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-branch-header',
  templateUrl: './branch-header.component.html',
  styleUrls: ['./branch-header.component.less']
})
export class BranchHeaderComponent implements OnInit {

  @Input() card: Card | null;
  @Input() link: string[] | null;
  @Input() cardId: string;
  @Input() pointId: string;
  @Input() compact = true;
  @Input() landingPage = false;

  constructor(public layout: LayoutService, private router: Router, private route: ActivatedRoute) { }

  ngOnInit(): void {
  }

  navigate(): void {
    const link = this.layout.mobile() ? this.link : (this.landingPage ? null : ["../.."]);
    const relativeTo = link && link[0][0] === '.' ? this.route : null;
    const params: any = {queryParamsHandling: 'preserve'};
    if (link) {
      if (relativeTo) {
        params.relativeTo = relativeTo;
      }
      this.router.navigate(link, params);
    }
  }
}
