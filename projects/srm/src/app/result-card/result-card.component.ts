import {AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, ViewChild} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Card, CARD_SNIPPET_FIELDS, SearchParams, TaxonomyItem, _h } from '../consts';

// MODES:
// - Branch services (desktop & mobile):
//      min height: 84px
//      font size: 20px
//      padding: 18px 8px
//      trailing tags
// - Search results
//    - desktop:
//        padding: 4px 8px
//        font size: 24px
//    - mobile:
//        padding: 4px 8px
//        font size: 20px
// - Map popup
//    - Single
//        font-size: 20px
//        padding: 4px 8px
//    - Multiple
//        font-size: 16px
//        padding: 5px 6px

@Component({
  selector: 'app-result-card',
  templateUrl: './result-card.component.html',
  styleUrls: ['./result-card.component.less'],
  host: {
    '[class.compact]' : 'compact',
    '[class.smaller]' : 'smaller',
    '[class.larger]' : 'larger',
    '[class.padded]' : 'padded',
    '[class.stacked]' : 'stacked',
  }
})
export class ResultCardComponent implements OnChanges, AfterViewInit {
  @Input() card: Card;
  @Input() searchParams: SearchParams;
  @Input() compact = false;
  @Input() smaller = false;
  @Input() larger = false;
  @Input() padded = false;
  @Input() stacked = false;
  @Input() bold = false;
  _h = _h;
  snippet: string | null = null;
  selectedResponses: TaxonomyItem[] = [];
  selectedSituations: TaxonomyItem[] = [];
  deselectedResponses: TaxonomyItem[] = [];
  deselectedSituations: TaxonomyItem[] = [];
  showFull = false;
  @ViewChild('descRef') descRef!: ElementRef;
  isOverflowing = false;

  ngAfterViewInit(): void {
    setTimeout(() => {
      const el = this.descRef?.nativeElement;
      if (el) {
        const lineHeightStr = getComputedStyle(el).lineHeight;
        const lineHeight = lineHeightStr === 'normal' ? 16 : parseFloat(lineHeightStr) || 16;
        const maxLines = 3;
        const maxHeight = lineHeight * maxLines;
        this.isOverflowing = el.scrollHeight > maxHeight;
      }
    });
  }

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

    const cardSituations = this.card.situations?.map((s) => Object.assign({}, s)) || [];
    const cardResponses = this.card.responses?.map((r) => Object.assign({}, r)) || [];

    this.selectedSituations = [];
    cardSituations.forEach((s: TaxonomyItem) => {
      if (this.searchParams?.allTaxonomyIds.includes(s.id || '')) {
        s.__selected = true;
        s.name = '<em>' + s.name + '</em>';
        this.selectedSituations.push(s);
      }
    });
    this.selectedResponses = [];
    cardResponses.forEach((r: TaxonomyItem) => {
      if (this.searchParams?.allTaxonomyIds.includes(r.id || '')) {
        r.__selected = true;
        r.name = '<em>' + r.name + '</em>';
        this.selectedResponses.push(r);
      }
    });

    if (this.card?._highlights && this.card?._highlights['situations.name.hebrew']) {
      const highlighted = this.card._highlights['situations.name.hebrew'];
      if (highlighted.length === this.card?.situations?.length) {
        cardSituations.forEach((s, i) => {
          if (!s.__selected && highlighted[i]?.indexOf('<em>') >= 0) {
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
        cardResponses.forEach((r, i) => {
          if (!r.__selected && highlighted[i]?.indexOf('<em>') >= 0) {
            r.name = highlighted[i];
            r.__selected = true;
            this.selectedResponses.push(r);
          }
        });
      }
    }
    if (this.selectedSituations.length === 0 && cardSituations.length > 0) {
      cardSituations[0].__selected = true;
      this.selectedSituations.push(cardSituations[0]);
    }
    if (cardResponses.length > 0) {
      cardResponses.forEach((r) => {
        r.category = r.id?.split(':')[1];
      });
      const requiredCategory = this.searchParams?.filter_response_categories?.length === 1 ?
          this.searchParams.filter_response_categories[0].slice('human_services:'.length) :
          this.card.response_category;
      if ((this.selectedResponses.length > 0 && requiredCategory !== this.selectedResponses[0].category) || this.selectedResponses.length === 0) {
        for (const r of cardResponses) {
          if (r.category === requiredCategory) {
            this.selectedResponses = [r, ...this.selectedResponses.filter((sr) => sr.id !== r.id)];
            r.__selected = true;
            break;
          }
        }
      }
    }

    let deselectedCount = 0;
    this.deselectedSituations = [];
    cardSituations.forEach((s: TaxonomyItem) => {
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
    this.deselectedResponses = [];
    let categories = this.selectedResponses.map((r) => r.category);
    cardResponses.forEach((r: TaxonomyItem) => {
      if (!r.__selected && deselectedCount < 2 && !categories.includes(r.category)) {
        this.deselectedResponses.push({
          id: r.id,
          name: '',
          category: r.category,
          __selected: false
        });
        deselectedCount++;
        r.__selected = true;
      }
    });
    if (deselectedCount < 2) {
      cardResponses.forEach((r: TaxonomyItem) => {
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
  }

  get showSnippet() {
    return this.snippet && !this.compact && !this.stacked;
  }
  onSelectExpendOrMinimize($event: MouseEvent) {
    $event.stopPropagation();
    $event.preventDefault();
    this.showFull = !this.showFull;

  }
}
