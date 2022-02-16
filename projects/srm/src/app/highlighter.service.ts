import { Injectable } from '@angular/core';
import { SearchService } from './search.service';
import { StateService } from './state.service';

@Injectable({
  providedIn: 'root'
})
export class HighlighterService {

  constructor(private search: SearchService) { }

  highlight(text: string) {
    const query = this.search.searchQuery;
    // text = text.split(' ').join('&nbsp;');
    if (query) {
      const parts = query.split(/\s+/);
      for (const part of parts) {
        if (part && part.length > 0) {
          const regex = new RegExp(part, 'gi');
          text = text.replace(regex, match => `<strong>${match}</strong>`);
        }
      }
      // text = `<span>${text}</span>`.split('<span></span>').join('');
    }
    return text;
  }
}
