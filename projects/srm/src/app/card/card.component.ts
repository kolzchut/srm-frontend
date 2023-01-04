import { DOCUMENT, Location } from '@angular/common'
import { AfterViewInit, Component, ElementRef, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { fromEvent, Subscription, timer } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiService } from '../api.service';
import { Card } from '../consts';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.less']
})
export class CardComponent implements OnInit {

  @Input() card: Card;

  @ViewChild('orgActions') orgActions: ElementRef;

  oddActions = false;

  constructor(private api: ApiService, @Inject(DOCUMENT) private document: Document) { }

  ngOnInit(): void {
  }

  ngOnChanges(): void {
    timer(0).subscribe(() => {
      this.oddActions = (this.orgActions?.nativeElement as HTMLElement)?.querySelectorAll('.active').length % 2 === 1;
    });
  }

  get suggestChangesForm() {
    return environment.suggestChangesForm + '?service_name=' + encodeURIComponent(this.card.service_name) + '&id=' + 
           encodeURIComponent(this.card.card_id) + '&url=' + encodeURIComponent(this.document.location.href);
  }
}
