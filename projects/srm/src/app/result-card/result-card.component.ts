import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { Card, CARD_SNIPPET_FIELDS, _h } from '../consts';

@Component({
  selector: 'app-result-card',
  templateUrl: './result-card.component.html',
  styleUrls: ['./result-card.component.less']
})
export class ResultCardComponent implements OnChanges {

  @Input() card: Card;
  _h = _h;
  snippet: string | null = null;

  constructor() { }

  ngOnChanges(): void {
    this.snippet = null;
    if (this.card?._snippets) {
      for (const k of CARD_SNIPPET_FIELDS) {
        if (this.card._snippets[k]) {
          const snippets = this.card._snippets[k];
          if (snippets.length > 0) {
            this.snippet = '&hellip; ' + snippets[0] + ' &hellip;';
            break;
          }
        }
      }  
    }
  }
}
