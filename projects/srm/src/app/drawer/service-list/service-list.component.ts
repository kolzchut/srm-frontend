import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ApiService } from '../../api.service';
import { Card, CategoryCountsResult } from '../../common/datatypes';
import { SearchService } from '../../search.service';

@Component({
  selector: 'app-service-list',
  templateUrl: './service-list.component.html',
  styleUrls: ['./service-list.component.less']
})
export class ServiceListComponent implements OnInit {
  services: Card[] = [];

  @Output() selected = new EventEmitter<any>();
  @Output() click = new EventEmitter<void>();

  constructor(public search: SearchService) {
    search.visibleServices.subscribe((services: any[]) => {
      this.services = services;
    });
  }

  ngOnInit(): void {
  }

  countsClick(ev: Event) {
    ev.stopPropagation();
    this.click.emit();
  }
  
  selectCard(card: Card) {
    this.selected.emit(card);
  }
}
