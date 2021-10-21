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
    if (query) {
      const parts = query.split(/\s+/);
      for (const part of parts) {
        if (part && part.length > 0) {
          const regex = new RegExp(part, 'gi');
          text = text.replace(regex, match => `<strong>${match}</strong>`);  
        }
      }
    }
    return text;
  }
}
