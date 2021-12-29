import { Injectable } from '@angular/core';
import { SearchService } from './search.service';
import { State, StateService } from './state.service';


@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  constructor(private state: StateService, private search: SearchService) {
    this.state.responseChanges.subscribe((state: State) => {
      if (state.responseId) {
        this.sendEvent('search', 'responses', state.responseId);
      }
    });
    this.state.selectedService.subscribe(({service, preview}) => {
      if (service) {
        this.sendEvent('view_service', 'services', service.service_name);
      }
    });
    this.state.placeNames.subscribe(placeName => {
      this.sendEvent('search', 'places', placeName);
    });
    this.search.searchedQueries.subscribe(query => {
      if (query) {
        this.sendEvent('query', 'search', query);
      }
    });
  }

  sendEvent(
    action: string, 
    event_category: string, 
    event_label?: string,  
    value?: number) {
      console.log('GA EVENT', action, event_category, event_label);
      gtag('event', action, {event_category, event_label, value});
    }
}
