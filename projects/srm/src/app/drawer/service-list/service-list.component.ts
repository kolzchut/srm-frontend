import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ApiService } from '../../api.service';
import { CategoryCountsResult } from '../../common/datatypes';
import { SearchService } from '../../search.service';

@Component({
  selector: 'app-service-list',
  templateUrl: './service-list.component.html',
  styleUrls: ['./service-list.component.less']
})
export class ServiceListComponent implements OnInit {

  counts: any[] = [];
  services: any[] = [];

  @Output() selected = new EventEmitter<any>();

  constructor(public search: SearchService) {
    search.visibleServices.subscribe((services: any[]) => {
      this.services = services;
    });
    search.visibleCounts.subscribe((counts: CategoryCountsResult[]) => {
      this.counts = counts.map(c => {
        return {
          category: c.category,
          count: c.count,
          color: c.color,
        };
      });
    });
  }

  ngOnInit(): void {
  }

}
