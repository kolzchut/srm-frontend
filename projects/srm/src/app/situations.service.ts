import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { environment } from '../environments/environment';
import { TaxonomyGroup } from './common/datatypes';

@Injectable({
  providedIn: 'root'
})
export class SituationsService {

  taxonomy = new ReplaySubject<TaxonomyGroup[]>(1);
  activeSituations: {[key: string]: string[]} = {
    'human_situations:age_group': ['human_situations:age_group:adults', 'human_situations:age_group:seniors', 'human_situations:age_group:teens', 'human_situations:age_group:children']
  };
  byId: {[key: string]: TaxonomyGroup} = {};

  constructor(private http: HttpClient) {
    this.http.get(environment.taxonomySituationsRL).subscribe((data) => {
      const taxonomies = data as TaxonomyGroup[];
      this.processTaxonomies(taxonomies);
      this.taxonomy.next(taxonomies);
      this.taxonomy.complete();
    });
  }

  processTaxonomies(taxonomies: TaxonomyGroup[]) {
    for (const taxonomy of taxonomies) {
      this.byId[taxonomy.slug] = taxonomy;
      if (taxonomy.items) {
        this.processTaxonomies(taxonomy.items);
      }
    }
  }

  isActive() {
    return Object.keys(this.activeSituations).length > 0;
  }

  activeGroup(groupId: string) {
    return !!this.activeSituations[groupId];
  }

  forGroup(groupId: string): TaxonomyGroup[] {
    return this.activeSituations[groupId].map(id => this.byId[id]);
  }

  sizeOfGroup(groupId: string): number {
    return this.activeSituations[groupId]?.length || 0;
  }

  nameOf(tg: TaxonomyGroup): string {
    const name = tg.name;
    if (typeof name === 'string') {
      return name;
     } else {
      return name.tx.he;
    }
  }
}
