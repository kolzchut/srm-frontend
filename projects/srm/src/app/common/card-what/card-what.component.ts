import { Component, Input, OnInit } from '@angular/core';
import { HighlighterService } from '../../highlighter.service';
import { getResponseCategoryColor, getResponseIdColor } from '../consts';
import { Card } from '../datatypes';

@Component({
  selector: 'app-card-what',
  templateUrl: './card-what.component.html',
  styleUrls: ['./card-what.component.less']
})
export class CardWhatComponent implements OnInit {

  @Input() card: Card;
  @Input() big = false;
  @Input() highlight = false;

  constructor(private highlighter: HighlighterService) { }

  ngOnInit(): void {
  }

  get categoryColor() {
    return this.card.response_category ? getResponseCategoryColor(this.card.response_category) : getResponseIdColor(this.card.responses[0].id);
  }

  highlightText(text: string) {
    if (this.highlight) {
      return this.highlighter.highlight(text);
    } else {
      return text;
    }
  }

}
