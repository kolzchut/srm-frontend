import { Injectable } from '@angular/core';
import { PlatformService } from './platform.service';
import { SearchService } from './search.service';
import { State, StateService } from './state.service';


@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  constructor(private state: StateService, private search: SearchService, private platform: PlatformService) {
    this.state.responseChanges.subscribe((state: State) => {
      if (state.responseId) {
        this.sendEvent('search', 'responses', state.responseId);
      }
    });
    this.state.orgChanges.subscribe((state: State) => {
      if (state.orgId) {
        this.sendEvent('search', 'org', state.orgId);
      }
    });
    this.state.selectedCard.subscribe(({card}) => {
      if (card) {
        this.sendEvent('view_service', 'services', card.service_name);
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
      this.platform.browser(() => {
        console.log('GA EVENT', action, event_category, event_label);
        window.gtag && gtag('event', action, {event_category, event_label, value});
      });
    }
}
