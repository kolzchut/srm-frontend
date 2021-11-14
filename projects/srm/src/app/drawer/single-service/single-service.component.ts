import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { environment } from 'projects/srm/src/environments/environment';
import { timer } from 'rxjs';
import { Card } from '../../common/datatypes';

@Component({
  selector: 'app-single-service',
  templateUrl: './single-service.component.html',
  styleUrls: ['./single-service.component.less']
})
export class SingleServiceComponent implements OnInit, AfterViewInit {

  @Input() item: Card | null = null;
  @ViewChild('details') detailsElement: ElementRef;

  card: Card;

  detailsVisible = false;
  detailsHeight = -10000;

  suggestChangesURL = environment.suggestChangesForm;

  constructor() { }

  ngOnInit(): void {
    if (this.item) {
      this.card = this.item;
    }
  }

  ngAfterViewInit(): void {
    timer(0).subscribe(() => {
      if (this.detailsElement) {
        const el = this.detailsElement.nativeElement;
        if (el) {
          this.detailsHeight = -(el.offsetHeight + 16 + 21);
        }          
      }
    });
  }
  
  geoLink() {
    return 'geo:' + this.card.branch_geometry.join(',');
  }

  urls() {
    return [
      ...(this.card.service_urls || []),
      ...(this.card.organization_urls || []),
      ...(this.card.branch_urls || []),
    ];
  }
}
