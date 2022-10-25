import { Component, Input, OnInit } from '@angular/core';
import { TaxonomyGroup } from '../../../common/datatypes';
import { SituationsService } from '../../../situations.service';

@Component({
  selector: 'app-situation-group-filter',
  templateUrl: './situation-group-filter.component.html',
  styleUrls: ['./situation-group-filter.component.less']
})
export class SituationGroupFilterComponent implements OnInit {

  @Input() group: TaxonomyGroup;

  constructor(public situations: SituationsService) { }

  ngOnInit(): void {
  }

  get groupId(): string {
    return this.group.slug;
  }

  get disabled(): boolean {
    return !this.situations.isEnabled(this.group.slug);
  }
}
