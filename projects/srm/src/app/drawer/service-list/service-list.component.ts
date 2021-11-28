import { AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { ApiService } from '../../api.service';
import { Card, CategoryCountsResult } from '../../common/datatypes';
import { PlatformService } from '../../platform.service';
import { SearchService } from '../../search.service';

@Component({
  selector: 'app-service-list',
  templateUrl: './service-list.component.html',
  styleUrls: ['./service-list.component.less']
})
export class ServiceListComponent implements OnInit, AfterViewInit {
  services: Card[] = [];

  @Output() selected = new EventEmitter<any>();
  @Output() click = new EventEmitter<void>();

  @ViewChild('more') more: ElementRef;
  observer: IntersectionObserver;

  constructor(public search: SearchService, private host: ElementRef, private platform: PlatformService) {
    search.visibleServices.subscribe((services: any[]) => {
      this.services = services;
    });
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    const moreEl = this.more.nativeElement;
    const rootEl = (this.host.nativeElement as HTMLElement).parentNode as HTMLElement;
    this.platform.browser(() => {
      this.observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          this.search.loadMore();
        }
      }, {root: rootEl, threshold: 1});  
      this.observer.observe(moreEl);
    });
  }

  countsClick(ev: Event) {
    ev.stopPropagation();
    this.click.emit();
  }
  
  selectCard(card: Card) {
    this.selected.emit(card);
  }
}
