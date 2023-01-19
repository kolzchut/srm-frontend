import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Card, CARD_SNIPPET_FIELDS, _h } from '../consts';

@Component({
  selector: 'app-result-card',
  templateUrl: './result-card.component.html',
  styleUrls: ['./result-card.component.less'],
  host: {
    '[class.compact]' : 'compact',
    '[class.smallDesktop]' : 'smallDesktop',
    '[class.stacked]' : 'stacked',
  }
})
export class ResultCardComponent implements OnChanges {

  @Input() card: Card;
  @Input() compact = false;
  @Input() stacked = false;
  @Input() small = true;
  @Input() smallDesktop = true;
  _h = _h;
  snippet: string | null = null;

  constructor(private sanitizer: DomSanitizer) { }

  ngOnChanges(): void {
    this.snippet = null;
    if (this.card?._snippets) {
      for (const k of CARD_SNIPPET_FIELDS) {
        if (this.card._snippets[k]) {
          const snippets = this.card._snippets[k];
          if (snippets.length > 0) {
            this.snippet = '&hellip; ' + snippets[0] + ' &hellip;';
            this.snippet = this.snippet.replace(/<[^e>]*>/g, '');
            this.snippet = this.sanitizer.sanitize(0, this.snippet);
            break;
          }
        }
      }  
    }
  }

  get showSnippet() {
    return this.snippet && !this.compact && !this.stacked;
  }
}
