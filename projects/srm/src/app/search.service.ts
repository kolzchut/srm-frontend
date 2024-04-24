import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  internalSearchQ = new BehaviorSubject<string | null>(null);
  searchQ = this.internalSearchQ.pipe(distinctUntilChanged());

  search(query: string | null) {
    this.internalSearchQ.next(query);
  }

  get searching() {
    return this.internalSearchQ.getValue() !== null;
  }
}
