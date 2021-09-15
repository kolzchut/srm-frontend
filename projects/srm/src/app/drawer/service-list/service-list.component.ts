import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ApiService } from '../../api.service';

@Component({
  selector: 'app-service-list',
  templateUrl: './service-list.component.html',
  styleUrls: ['./service-list.component.less']
})
export class ServiceListComponent implements OnInit {

  counts: any[] = [];
  services: any[] = [];

  @Output() selected = new EventEmitter<any>();

  constructor(public api: ApiService) {
    api.visibleServices.subscribe((services: any[]) => {
      this.services = services;
    });
    api.visibleCounts.subscribe((counts: any[]) => {
      this.counts = counts.map(c => {
        return {
          display: c.display,
          count: c.count,
          color: '#07B2EA'
        };
      });
    });
  }

  ngOnInit(): void {
  }

}
