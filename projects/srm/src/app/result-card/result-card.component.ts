import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Card, CARD_SNIPPET_FIELDS, SearchParams, TaxonomyItem, _h } from '../consts';

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
  @Input() searchParams: SearchParams;
  @Input() compact = false;
  @Input() stacked = false;
  @Input() small = true;
  @Input() smallDesktop = true;
  _h = _h;
  snippet: string | null = null;
  selectedResponses: TaxonomyItem[] = [];
  selectedSituations: TaxonomyItem[] = [];
  deselectedResponses: TaxonomyItem[] = [];
  deselectedSituations: TaxonomyItem[] = [];

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
      if (this.searchParams?.allTaxonomyIds.includes(s.id || '')) {
        s.__selected = true;
        s.name = '<em>' + s.name + '</em>';
        this.selectedSituations.push(s);
      }
    });
    this.selectedResponses = [];
    this.card.responses?.forEach((r: TaxonomyItem) => {
      if (this.searchParams?.allTaxonomyIds.includes(r.id || '')) {
        r.__selected = true;
        r.name = '<em>' + r.name + '</em>';
        this.selectedResponses.push(r);
      }
    });

    if (this.card?._highlights && this.card?._highlights['situations.name.hebrew']) {
      const highlighted = this.card._highlights['situations.name.hebrew'];
      if (highlighted.length === this.card?.situations?.length) {
        this.card.situations.forEach((s, i) => {
          if (!s.__selected && highlighted[i].indexOf('<em>') >= 0) {
            s.name = highlighted[i];
            s.__selected = true;
            this.selectedSituations.push(s);
          }
        });
      }
    }
    if (this.card?._highlights && this.card?._highlights['responses.name.hebrew']) {
      const highlighted = this.card._highlights['responses.name.hebrew'];
      if (highlighted.length === this.card?.responses?.length) {
        this.card.responses.forEach((r, i) => {
          if (!r.__selected && highlighted[i].indexOf('<em>') >= 0) {
            r.name = highlighted[i];
            r.__selected = true;
            this.selectedResponses.push(r);
          }
        });
      }
    }
    if (this.selectedSituations.length === 0 && this.card.situations?.length > 0) {
      this.card.situations[0].__selected = true;
      this.selectedSituations.push(this.card.situations[0]);
    }
    if (this.card.responses?.length > 0) {
      this.card.responses.forEach((r) => {
        r.category = r.id?.split(':')[1];
      });
      const requiredCategory = this.searchParams?.filter_response_categories?.length === 1 ? 
          this.searchParams.filter_response_categories[0].slice('human_services:'.length) : 
          this.card.response_category;
      if ((this.selectedResponses.length > 0 && requiredCategory !== this.selectedResponses[0].category) || this.selectedResponses.length === 0) {
        for (const r of this.card.responses) {
          if (r.category === requiredCategory) {
            this.selectedResponses = [r, ...this.selectedResponses.filter((sr) => sr.id !== r.id)];
            break;
          }
        }
      }
    }

    let deselectedCount = 0;
    this.card.situations?.forEach((s: TaxonomyItem) => {
      if (!s.__selected && deselectedCount < 2) {
        this.deselectedSituations.push({
          id: s.id,
          name: '',
          category: s.category,
          __selected: false
        });
        deselectedCount++;
      }
    });
    deselectedCount = 0;
    this.card.responses?.forEach((r: TaxonomyItem) => {
      if (!r.__selected && deselectedCount < 2) {
        this.deselectedResponses.push({
          id: r.id,
          name: '',
          category: r.category,
          __selected: false
        });
        deselectedCount++;
      }
    });
  }

  get showSnippet() {
    return this.snippet && !this.compact && !this.stacked;
  }
}
