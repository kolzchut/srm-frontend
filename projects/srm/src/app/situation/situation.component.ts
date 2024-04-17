import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { TaxonomyItem, prepareQuery } from '../consts';
import { LayoutService } from '../layout.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-situation',
  templateUrl: './situation.component.html',
  styleUrls: ['./situation.component.less']
})
export class SituationComponent implements OnChanges {

  @Input() situation: TaxonomyItem = {};
  @Input() small = false;
  @Input() link = false;
  @Input() selected = false;

  @Output() clicked = new EventEmitter<void>();

  hover = false;
  querySituation = '';

  constructor(private layout: LayoutService, private router: Router) { }

  ngOnChanges(): void {
    this.querySituation = prepareQuery(this.situation.name || '');
  }

  get smaller() {
    return this.small || (!this.link && this.layout.mobile());
  }

  onClick() {
    this.clicked.emit();
  }

  doSearch(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    // [routerLink]='["/q"]'
    // [queryParams]='{q: situation.name}'
    this.router.navigate(['/q'], { queryParams: { q: this.situation.name } });
  }
}
