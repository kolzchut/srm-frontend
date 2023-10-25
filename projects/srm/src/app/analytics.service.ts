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

  cardToItem(card: Card, idx: number, item_list_name?: string | null, action?: string): any {
    const address = card.address_parts ? 
      (card.address_parts.primary + (card.address_parts.secondary ? ', ' + card.address_parts.secondary : '')) :
      card.branch_address;
    const categories: string[] = [];
    for (let response of card.responses.slice(0, 2)) {
      if (response.id) {
        categories.push(response.id);
      }
    }
    for (let situation of card.situations.slice(0, 3)) {
      if (situation.id) {
        categories.push(situation.id);
      }
    }
    for (let response of card.responses.slice(2)) {
      if (response.id) {
        categories.push(response.id);
      }
    }
    for (let situation of card.situations.slice(3)) {
      if (situation.id) {
        categories.push(situation.id);
      }
    }
    let item: any = {
      item_name: card.service_name,
      item_brand: card.organization_name,
      item_variant: address,
    };
    if (idx && idx > 0) {
      item.index = idx;
    }
    if (item_list_name) {
      item.item_list_name = item_list_name;
    }
    if (action) {
      item.cta_action = action;
    }
    if (categories[0]) {
      item.item_category = categories[0];
    }
    if (categories[1]) {
      item.item_category2 = categories[1];
    }
    if (categories[2]) {
      item.item_category3 = categories[2];
    }
    if (categories[3]) {
      item.item_category4 = categories[3];
    }
    if (categories[4]) {
      item.item_category5 = categories[4];
    }
    return item;
  }


  searchEvent(params: SearchParams, isLandingPage: boolean, numTotalResults: number, items: Card[]) {
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

      window.gtag({
        event: 'view_item_list',
        item_list_name: title,
        items: items.map((item, idx) => this.cardToItem(item, idx + 1))
      });
    }
  }

  cardEvent(card: Card, params: SearchParams | null, isLandingPage: boolean, index: number) {
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

      window.gtag({
        event: 'view_item',
        items: [this.cardToItem(card, index, params?.original_query)]
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

      window.gtag({
        event: 'add_to_cart',
        items: [this.cardToItem(card, 0, null, action)]
      });
    }
  }
}
