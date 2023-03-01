import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Card, CARD_SNIPPET_FIELDS, TaxonomyItem, _h } from '../consts';

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
  @Input() taxonomyIds: string[];
  @Input() compact = false;
  @Input() stacked = false;
  @Input() small = true;
  @Input() smallDesktop = true;
  _h = _h;
  snippet: string | null = null;
  selectedResponses: TaxonomyItem[] = [];
  selectedSituations: TaxonomyItem[] = [];

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

    this.selectedSituations = [];
    this.card.situations?.forEach((s: TaxonomyItem) => {
      if (this.taxonomyIds?.includes(s.id || '')) {
        s.__selected = true;
        this.selectedSituations.push(s);
      }
    });
    this.selectedResponses = [];
    this.card.responses?.forEach((r: TaxonomyItem) => {
      if (this.taxonomyIds?.includes(r.id || '')) {
        r.__selected = true;
        this.selectedResponses.push(r);
      }
    });

    if (this.card?._highlights && this.card?._highlights['situations.name']) {
      const highlighted = this.card._highlights['situations.name'];
      if (highlighted.length === this.card?.situations?.length) {
        this.card.situations.forEach((s, i) => {
          s.name = highlighted[i];
          if (!s.__selected && s.name.indexOf('<em>') >= 0) {
            s.__selected = true;
            this.selectedSituations.push(s);
          }
        });
      }
    }
    if (this.card?._highlights && this.card?._highlights['responses.name']) {
      const highlighted = this.card._highlights['responses.name'];
      if (highlighted.length === this.card?.responses?.length) {
        this.card.responses.forEach((r, i) => {
          r.name = highlighted[i];
          if (!r.__selected && r.name.indexOf('<em>') >= 0) {
            r.__selected = true;
            this.selectedResponses.push(r);
          }
        });
      }
    }
    if (this.selectedSituations.length === 0 && this.card.situations?.length > 0) {
      this.selectedSituations.push(this.card.situations[0]);
    }
    if (this.card.responses?.length > 0) {
      this.card.responses.forEach((r) => {
        r.category = r.id?.split(':')[1];
      });
      if ((this.selectedResponses.length > 0 && this.card.response_category !== this.selectedResponses[0].category) || this.selectedResponses.length === 0) {
        for (const r of this.card.responses) {
          if (r.category === this.card.response_category) {
            this.selectedResponses = [r, ...this.selectedResponses.filter((sr) => sr.id !== r.id)];
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
