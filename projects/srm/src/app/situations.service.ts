import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, ReplaySubject, timer } from 'rxjs';
import { first } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { TaxonomyGroup } from './common/datatypes';
import { State, StateService } from './state.service';


export type TaxonomyGroupEditor = {
    group: TaxonomyGroup,
    active: boolean
};

@Injectable({
  providedIn: 'root'
})
export class SituationsService {

  taxonomy = new ReplaySubject<TaxonomyGroup[]>(1);
  activeSituations: {[key: string]: TaxonomyGroup[]} = {};
  byId: {[key: string]: TaxonomyGroup} = {};
  editors: TaxonomyGroupEditor[] = [];
  PREFIX = 'human_situations:';


  constructor(private http: HttpClient, private state: StateService) {
    this.http.get(environment.taxonomySituationsRL).subscribe((data) => {
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
          const group = this.PREFIX + situation[0];
          const items = situation.slice(1).map(item => this.PREFIX + item).map(item => this.byId[item]);
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
        .map(key => [key.slice(this.PREFIX.length), ...this.activeSituations[key].map(i => i.slug.slice(this.PREFIX.length))]);
  }
}
