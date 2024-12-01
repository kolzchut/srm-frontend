import { Component, Input, OnInit } from '@angular/core';
import { AreaSearchState } from '../area-search-selector/area-search-state';
import { LayoutService } from '../layout.service';

@Component({
  selector: 'app-area-search',
  templateUrl: './area-search.component.html',
  styleUrls: ['./area-search.component.less']
})
export class AreaSearchComponent implements OnInit {

  @Input() areaSearchState: AreaSearchState;
  @Input() isHideMapIcon = false;

  constructor(public layout: LayoutService) { }

  ngOnInit(): void {
  }

}
