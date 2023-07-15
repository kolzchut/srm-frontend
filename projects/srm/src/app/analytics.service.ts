import { Injectable } from '@angular/core';
import { Card, SearchParams } from './consts';
import { PlatformService } from './platform.service';

declare const window: {
  gtag: any
};


@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  constructor(private platform: PlatformService) { }

  searchEvent(params: SearchParams, isLandingPage: boolean, numTotalResults: number) {
    const title = params.original_query;
    console.log('EVENT search', title, isLandingPage, numTotalResults);
    if (title && this.platform.browser() && window.gtag) {
      const responseCount = (params.filter_responses || []).length;
      window.gtag({
        event: 'srm:search',
        search_term: title,
        filter_count: params.allTaxonomyIds.filter(x => !!x).length - responseCount,
        filter_responses_count: responseCount,
        filter_response_categories_count: (params.filter_response_categories || []).length,
        filter_national: params.national ? 1 : 0,
        landing_page: isLandingPage ? 1 : 0,
        search_structured: !!params.query ? 0 : 1,
        num_results_total: numTotalResults,
      });
    }
  }

  cardEvent(card: Card, params: SearchParams | null, isLandingPage: boolean) {
    console.log('EVENT card', card);
    if (this.platform.browser() && window.gtag) {
      window.gtag({
        event: 'srm:card',
        card_id: card.card_id,
        card_name: card.service_name,
        card_org: card.organization_id,
        landing_page: isLandingPage ? 1 : 0,
        search_term: params?.original_query,
        search_structured: !!params?.query ? 0 : 1,
      });
    }
  }

  cardActionEvent(card: Card, action: string, action_url: string) {
    console.log('EVENT card action', action, action_url, card);
    if (window.gtag && this.platform.browser()) {
      window.gtag({
        event: 'srm:card_action',
        card_id: card.card_id,
        card_name: card.service_name,
        card_org: card.organization_id,
        action_type: action,
        action_url: action_url
      });
    }
  }
}
