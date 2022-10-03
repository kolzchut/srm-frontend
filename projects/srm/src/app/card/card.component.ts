import { Location } from '@angular/common'
import { AfterViewInit, Component, ElementRef, Input, OnInit } from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { ApiService } from '../api.service';
import { Card } from '../consts';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.less']
})
export class CardComponent implements OnInit {

  @Input() card: Card;

  constructor(private api: ApiService) { }

  ngOnInit(): void {
  }

  ngOnChanges(): void {
  }
}
