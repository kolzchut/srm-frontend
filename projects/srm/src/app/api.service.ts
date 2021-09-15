import { Injectable } from '@angular/core';
import { from, ReplaySubject, Subject } from 'rxjs';
import { debounceTime, mergeMap } from 'rxjs/operators';
import { StateService } from './state.service';

import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  visibleServices = new ReplaySubject<any[]>(1);
  visibleCounts = new ReplaySubject<any[]>(1);

  constructor(private state: StateService, private http: HttpClient) {
    state.state.pipe(
      debounceTime(1000),
      mergeMap((state) => {
        console.log('FETCHING SERVICES');
        return this.getServices(state);
      })
    ).subscribe((services: any) => {
      this.visibleServices.next(services.services);
      this.visibleCounts.next(services.counts);
    });
  }

  getServices(state: any) {
    if (environment.servicesURL && environment.servicesURL.length > 0) {
      return this.http.get(environment.servicesURL);
    } else {
      return from([environment.servicesMock])
    }
  }

}
