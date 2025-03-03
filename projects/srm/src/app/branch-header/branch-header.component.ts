import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { Card } from '../consts';
import { LayoutService } from '../layout.service';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-branch-header',
  templateUrl: './branch-header.component.html',
  styleUrls: ['./branch-header.component.less']
})
export class BranchHeaderComponent implements OnInit, OnChanges {

  @Input() card: Card | null;
  @Input() link: string[] | null;
  @Input() cardId: string;
  @Input() pointId: string;
  @Input() compact = true;
  @Input() landingPage = false;

  imageUrl: string = '';
  imageMap = environment.orgIdLogoMap || {};
  orgNameToLogoMap = environment.orgNameToLogoMap || {};

  constructor(public layout: LayoutService, private router: Router, private route: ActivatedRoute) { }

  ngOnInit(): void {
  }

  ngOnChanges(): void {
    this.imageUrl = this.setLogo();
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

  setLogo(): string {
    const orgId = this.card?.organization_id;
    if (orgId) {
      const logo = this.imageMap[orgId];
      if (logo) return `assets/img/${logo}`;
    }
  
    const serviceId = this.card?.service_id?.split("-")[0];
    if (serviceId) {
      const logo = this.orgNameToLogoMap[serviceId];
      if (logo) return `assets/img/${logo}`;
    }
    return "";
  }
}
