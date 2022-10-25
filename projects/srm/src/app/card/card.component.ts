import { Location } from '@angular/common'
import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { fromEvent, Subscription, timer } from 'rxjs';
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

  constructor(private api: ApiService) { }

  ngOnInit(): void {
  }

  ngOnChanges(): void {
    timer(0).subscribe(() => {
      console.log('ODD', (this.orgActions?.nativeElement as HTMLElement)?.querySelectorAll('.active').length);
      this.oddActions = (this.orgActions?.nativeElement as HTMLElement)?.querySelectorAll('.active').length % 2 === 1;
    });
  }
}
