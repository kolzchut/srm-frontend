import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { environment } from '../environments/environment';
import { Response } from './common/datatypes';

type ResponseMap = {[key: string]: Response};

@Injectable({
  providedIn: 'root'
})
export class ResponsesService {

  taxonomy = new ReplaySubject<ResponseMap>(1);
  byId: ResponseMap = {};

  constructor(private http: HttpClient) {
    this.http.get(environment.taxonomyResponsesURL).subscribe((data) => {
      const taxonomies = data as Response[];
      this.processTaxonomies(taxonomies);
      this.taxonomy.next(this.byId);
      this.taxonomy.complete();
    });
  }

  processTaxonomies(taxonomies: Response[]) {
    for (const taxonomy of taxonomies) {
      if (taxonomy.id) {
        this.byId[taxonomy.id] = taxonomy;
      }
    }
  }

  getResponseName(id: string): string {
    return this.byId[id].name;
  }

}