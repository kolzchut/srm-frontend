import { Location } from '@angular/common'
import { AfterViewInit, Component, ElementRef, Input, OnInit } from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.less']
})
export class CardComponent implements OnInit {

  @Input() cardId = '';
  card: any = {};

  constructor(private api: ApiService) { }

  ngOnInit(): void {
  }

  ngOnChanges(): void {
    if (this.cardId.length) {
      this.api.getCard(this.cardId).subscribe(card => {
        console.log('CARD', card);
        this.card = card;
      });
    } else {
      this.card = {};
    }
  }
}
