import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { SearchParams } from '../consts';

@Component({
  selector: 'app-searchbox-header',
  templateUrl: './searchbox-header.component.html',
  styleUrls: ['./searchbox-header.component.less']
})
export class SearchboxHeaderComponent implements OnChanges {

  @Input() query: string | null = null;
  @Input() searchParams: SearchParams;

  responseDisplay: string | null = null;
  situationDisplay: string | null = null;

  constructor(private api: ApiService) { }

  ngOnChanges(): void {
    if (this.searchParams?.response) {
      this.api.getResponse(this.searchParams?.response).subscribe((item) => {
        this.responseDisplay = item?.name || null;
      });
    } else {
      this.responseDisplay = null;
    }
    if (this.searchParams?.situation) {
      this.api.getSituation(this.searchParams?.situation).subscribe((item) => {
        this.situationDisplay = item?.name || null;
      });
    } else {
      this.situationDisplay = null;
    }
  }

}
