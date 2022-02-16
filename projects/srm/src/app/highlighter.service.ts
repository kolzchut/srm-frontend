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
          const regex = new RegExp(part + '[^ ]', 'gi');
          text = text.replace(regex, match => `<strong>${match.slice(0, -1)}</strong>${match.slice(-1)}`);
          const regex_end = new RegExp(part + '$', 'gi');
          text = text.replace(regex_end, match => `<strong>${match}</strong>`);
          const regex_sp = new RegExp(part + ' ', 'gi');
          text = text.replace(regex_sp, match => `<strong>${match.slice(0, -1)}</strong>&nbsp;`);
        }
      }
      // text = `<span>${text}</span>`.split('<span></span>').join('');
    }
    return text;
  }
}
