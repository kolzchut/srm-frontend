import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, ReplaySubject, timer } from 'rxjs';
import { filter, first } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { SITUATIONS_PREFIX } from './common/consts';
import { TaxonomyGroup } from './common/datatypes';
import { PlatformService } from './platform.service';
import { State, StateService } from './state.service';


export type TaxonomyGroupEditor = {
    group: TaxonomyGroup,
    state: 'pre' | 'active' | 'hidden',
};

@Injectable({
  providedIn: 'root'
})
export class SituationsService {

  taxonomy = new ReplaySubject<TaxonomyGroup[]>(1);
  stateSituations = new ReplaySubject<State>(1);
  activeSituations: {[key: string]: TaxonomyGroup[]} = {};
  byId: {[key: string]: TaxonomyGroup} = {};
  editors: TaxonomyGroupEditor[] = [];
  latestState: string[][] = [];
  activeSituationCount = 0;

  constructor(private http: HttpClient, private state: StateService, private platform: PlatformService) {
    this.platform.browser(() => {
      this.state.situationChanges.subscribe(state => {
        this.stateSituations.next(state);
      });
      this.http.get(environment.taxonomySituationsURL).subscribe((data) => {
        const taxonomies = data as TaxonomyGroup[];
        this.processTaxonomies(taxonomies);
        this.taxonomy.next(taxonomies);
        this.taxonomy.complete();
        this.stateSituations.subscribe((state: State) => {
          const situations = state.situations || [];
          this.activeSituations = {};
          this.activeSituationCount = 0;
          situations.forEach(situation => {
            const group = SITUATIONS_PREFIX + situation[0];
            const items = situation.slice(1).map(item => SITUATIONS_PREFIX + item).map(item => this.byId[item]);
            this.activeSituationCount += items.length;
            this.activeSituations[group] = items;
          });
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
            state: 'pre',
          });  
        }
      }
    });
    this.editors = newEditors;
    timer(0).subscribe(() => {
      this.editors.forEach((editor, index) => {
        editor.state = index < newEditors.length - 1 ? 'hidden' : 'active';
      });
    });
  }

  popEditor() {
    if (this.editors.length > 0) {
      this.editors[this.editors.length - 1].state = 'pre';
      if (this.editors.length > 1) {
        this.editors[this.editors.length - 2].state = 'active';
      }
      timer(250).pipe(
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
    this.updateState();
  }

  updateState() {
    this.latestState = Object.keys(this.activeSituations)
      .map(key => [key.slice(SITUATIONS_PREFIX.length), ...this.activeSituations[key].map(i => i.slug.slice(SITUATIONS_PREFIX.length))]);
    this.state.situations = this.latestState;
    this.activeSituationCount = 0;
    this.latestState.forEach(situation => {
      this.activeSituationCount += situation.length - 1;
    });
  }
}
