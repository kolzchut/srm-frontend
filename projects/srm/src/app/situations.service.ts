import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, ReplaySubject, timer } from 'rxjs';
import { first } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { SITUATIONS_PREFIX } from './common/consts';
import { TaxonomyGroup } from './common/datatypes';
import { State, StateService } from './state.service';


export type TaxonomyGroupEditor = {
    group: TaxonomyGroup,
    active: boolean
};


export class SituationMatcher {
  constructor(private situations: string[][]) {}

  match(situations: string[]): boolean {
    const prefixes = situations.map(s => s.split(':').slice(0, 2).join(':'));
    // console.log('MATCHING', this.situations, situations, prefixes);
    let found = false;
    for (const group of this.situations) {
      const prefix = SITUATIONS_PREFIX + group[0];
      if (prefixes.indexOf(prefix) < 0) {
        // console.log('OUT 1', prefix);
        continue;
      }
      let groupFound = false;
      for (let idx = 1 ; idx < group.length ; idx++) {
        if (situations.indexOf(SITUATIONS_PREFIX + group[idx]) >= 0) {
          if (!found && group[0] !== 'age_group') {
            console.log('FOUND!!', this.situations, situations);
            found = true;
          }
          groupFound = true;
          break;
        }
      }
      if (!groupFound) {
        // console.log('GROUP NOT FOUND', situations, group);
        return false;
      }
    }
    return found;
  }
}


@Injectable({
  providedIn: 'root'
})
export class SituationsService {

  taxonomy = new ReplaySubject<TaxonomyGroup[]>(1);
  activeSituations: {[key: string]: TaxonomyGroup[]} = {};
  byId: {[key: string]: TaxonomyGroup} = {};
  editors: TaxonomyGroupEditor[] = [];


  constructor(private http: HttpClient, private state: StateService) {
    this.http.get(environment.taxonomySituationsURL).subscribe((data) => {
      const taxonomies = data as TaxonomyGroup[];
      this.processTaxonomies(taxonomies);
      this.taxonomy.next(taxonomies);
      this.taxonomy.complete();
      this.state.state.pipe(
        first()
      ).subscribe((state: State) => {
        const situations = state.situations || [];
        this.activeSituations = {};
        situations.forEach(situation => {
          const group = SITUATIONS_PREFIX + situation[0];
          const items = situation.slice(1).map(item => SITUATIONS_PREFIX + item).map(item => this.byId[item]);
          this.activeSituations[group] = items;
        });
      });
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
    return this.activeSituations[groupId];
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

  activeEditors(): TaxonomyGroupEditor[] {
    return this.editors;
  }

  addEditor(group: TaxonomyGroup) {
    const parts = group.slug.split(':');
    const slugs = [];
    for (let i = 2; i <= parts.length; i++) {
      const slug = parts.slice(0, i).join(':');
      slugs.push(slug);
    }
    const newEditors: TaxonomyGroupEditor[] = [];
    slugs.forEach(slug => {
      const editor = this.editors.filter(editor => editor.group.slug === slug);
      if (editor.length > 0) {
        newEditors.push(editor[0]);
      } else {
        const _group = this.byId[slug];
        if (_group.items) {
          newEditors.push({
            group: this.byId[slug],
            active: false
          });  
        }
      }
    });
    this.editors = newEditors;
    timer(0).subscribe(() => {
      this.editors.forEach(editor => {
        editor.active = true;
      });
    });
  }

  popEditor() {
    if (this.editors.length > 0) {
      this.editors[this.editors.length - 1].active = false;
      timer(300).pipe(
        first()
      ).subscribe(() => {
        const removed = this.editors.pop();
      });
    }
  }

  checked(item: TaxonomyGroup): boolean {
    const group = item.slug.split(':').slice(0, 2).join(':');
    const active = this.activeSituations[group] || [];
    return active.map(i => i.slug).indexOf(item.slug) > -1;
  }

  check(item: TaxonomyGroup) {
    const group = item.slug.split(':').slice(0, 2).join(':');
    const active = this.activeSituations[group] = this.activeSituations[group] || [];
    if (active.map(i => i.slug).indexOf(item.slug) === -1) {
      active.push(item);
    } else {
      active.splice(active.map(i => i.slug).indexOf(item.slug), 1);
    }
    if (active.length === 0) {
      delete this.activeSituations[group];
    }
    this.state.situations = Object.keys(this.activeSituations)
        .map(key => [key.slice(SITUATIONS_PREFIX.length), ...this.activeSituations[key].map(i => i.slug.slice(SITUATIONS_PREFIX.length))]);
  }
}
