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
    if (this.card?._highlights['situations.name']) {
      const highlighted = this.card._highlights['situations.name'];
      if (highlighted.length === this.card?.situations?.length) {
        this.card.situations.forEach((s, i) => {
          s.name = highlighted[i];
        });
      }
    }
    if (this.card?._highlights['responses.name']) {
      const highlighted = this.card._highlights['responses.name'];
      if (highlighted.length === this.card?.responses?.length) {
        this.card.responses.forEach((r, i) => {
          r.name = highlighted[i];
        });
      }
    }
  }

  get showSnippet() {
    return this.snippet && !this.compact && !this.stacked;
  }
}
