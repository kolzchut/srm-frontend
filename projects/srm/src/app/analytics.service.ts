import { Injectable } from '@angular/core';
import { Card, SearchParams } from './consts';
import { PlatformService } from './platform.service';
import { WindowService } from './window.service';

declare const window: {
  gtag: any
  location: Location;
};


@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  landingPage = true;
  currentPageLanding = true;
  previous_url: string | null = '';

  constructor(private platform: PlatformService, private _: WindowService) {
    this.gtag(['config', 'G-SSW46Z8STP', {'send_page_view': false}]);
    this.platform.browser(() => {
      this.previous_url = this._.D.referrer || '';
    });
  }

  gtag(...args: any[]) {
    if (this.platform.browser() && window?.gtag) {
      window.gtag(...args);
    }
  }

  pageView(url: string) {
    this.gtag({
      event: 'srm:page_view',
      page_path: url,
      landing_page: this.landingPage ? 'yes' : 'no',
      previous_url: this.previous_url,
    });
    this.currentPageLanding = this.landingPage;
    this.landingPage = false;
  }

  cardToItem(card: Card, idx: number, item_list_name?: string | null): any {
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
    const item_name = card.service_name.split('"').join('');
    const item_brand = card.organization_name.split('"').join('');
    const item_variant = address.split('"').join('');
    let item: any = { item_name, item_brand, item_variant };
    if (idx && idx > 0) {
      item.index = idx;
    }
    if (item_list_name) {
      item.item_list_name = item_list_name;
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


  searchEvent(params: SearchParams, numTotalResults: number, items: Card[], offset=0) {
    const title = params.original_query;
    console.log('EVENT search', title, numTotalResults);
    if (title) {
      const responseCount = (params.filter_responses || []).length;
      const eventParams = {
        search_term: title,
        filter_count: params.allTaxonomyIds.filter(x => !!x).length - responseCount,
        filter_responses_count: responseCount,
        filter_response_categories_count: (params.filter_response_categories || []).length,
        search_structured: !!params.query ? 'no' : 'yes',
        num_results_total: numTotalResults,
      };

      if (offset === 0) {
        this.gtag({
          event: 'srm:search',
          ...eventParams
        });
      }

      while (items.length > 0) {
        const itemsBatch = items.splice(0, 10);
        this.gtag({
          event: 'view_item_list',
          ecommerce: {
            item_list_name: title,
            items: itemsBatch.map((item, idx) => this.cardToItem(item, idx + 1 + offset))
          },
          ...eventParams
        });
        offset += itemsBatch.length;
      }
    }
  }

  cardEvent(card: Card, params: SearchParams | null, index: number, select: boolean, from: string|null=null) {
    console.log('EVENT card', card);
    if (select) {
      this.gtag({
        event: 'select_item',
        ecommerce: {
          item_list_name: params?.original_query,
          items: [this.cardToItem(card, index)]
        }
      });  
    } else {
      const eventParams = {
        card_id: card.card_id,
        card_name: card.service_name,
        card_org: card.organization_id,
        search_term: params?.original_query,
        search_structured: !!params?.query ? 'no' : 'yes',
      };
      this.gtag({
        event: 'srm:card',
        ...eventParams
      });

      this.gtag({
        event: 'view_item',
        ecommerce: {
          items: [this.cardToItem(card, index, params?.original_query)]
        },
        ...eventParams
      });  

      this.interactionEvent('card', from || 'unknown', undefined, params);
    }
  }

  cardActionEvent(card: Card, action: string, action_url: string) {
    console.log('EVENT card action', action, action_url, card);
    const eventParams = {
      card_id: card.card_id,
      card_name: card.service_name,
      card_org: card.organization_id,
      action_type: action,
      action_url: action_url
    };

    this.gtag({
      event: 'srm:card_action',
      ...eventParams
    });

    this.gtag({
      event: 'add_to_cart',
      cta_action: action,
      ecommerce: {
        items: [this.cardToItem(card, 0)]
      },
      ...eventParams
    });
  }

  interactionEvent(what: string, where: string, content?: string, params?: SearchParams | null) {
    console.log('EVENT interaction', where, what);
    const event: any = {
      event: 'srm:interaction',
      interaction_where: where,
      interaction_what: what,
      interaction_content: content || null,
    };
    if (params) {
      event['search_term'] = params.original_query;
      event['search_structured'] = !!params.query ? 'no' : 'yes';
    }
    this.gtag(event);
  }
}
