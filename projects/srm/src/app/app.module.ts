import { APP_INITIALIZER, ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { Router } from "@angular/router";
import * as Sentry from "@sentry/angular-ivy";

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { PageComponent } from './page/page.component';
import { CustomReuseStrategy } from './custom-reuse-strategy';
import { RouteReuseStrategy } from '@angular/router';
import { MapComponent } from './map/map.component';
import { HomepageComponent } from './homepage/homepage.component';
import { SearchComponent } from './search/search.component';
import { ResultsDrawerComponent } from './results-drawer/results-drawer.component';
import { ImageButtonComponent } from './image-button/image-button.component';
import { CardComponent } from './card/card.component';
import { ResponseComponent } from './response/response.component';
import { SituationComponent } from './situation/situation.component';
import { BranchContainerComponent } from './branch-container/branch-container.component';
import { SearchboxHeaderComponent } from './searchbox-header/searchbox-header.component';
import { SearchResultsComponent } from './search-results/search-results.component';
import { ResultStackComponent } from './result-stack/result-stack.component';
import { ResultCardComponent } from './result-card/result-card.component';
import { SearchFiltersComponent } from './search-filters/search-filters.component';
import { PointResultStackComponent } from './point-result-stack/point-result-stack.component';
import { CardActionComponent } from './card-action/card-action.component';
import { CardActionPhoneComponent } from './card-action-phone/card-action-phone.component';
import { CardActionUrlComponent } from './card-action-url/card-action-url.component';
import { CardActionNavComponent } from './card-action-nav/card-action-nav.component';
import { SearchFilterCheckboxComponent } from './search-filter-checkbox/search-filter-checkbox.component';
import { MenuIconComponent } from './menu-icon/menu-icon.component';
import { MenuComponent } from './menu/menu.component';
import { MenuPopupContactComponent } from './menu/menu-popup/menu-popup-contact/menu-popup-contact.component';
import { MenuPopupPartnersComponent } from './menu/menu-popup/menu-popup-partners/menu-popup-partners.component';
import { MenuPopupAboutComponent } from './menu/menu-popup/menu-popup-about/menu-popup-about.component';
import { MenuPopupIndexComponent } from './menu/menu-popup/menu-popup-index/menu-popup-index.component';
import { MenuPopupComponent } from './menu/menu-popup/menu-popup.component';
import { BranchHeaderComponent } from './branch-header/branch-header.component';
import { MapWindowComponent } from './map-window/map-window.component';
import { CardContainerComponent } from './card-container/card-container.component';
import { QuickActionsComponent } from './quick-actions/quick-actions.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DisclaimerFooterComponent } from './disclaimer-footer/disclaimer-footer.component';
import { DesktopMenuLinksComponent } from './desktop-menu-links/desktop-menu-links.component';
import { ArrowToTabDirective } from './arrow-to-tab.directive';
import { MapPopupHoverSingleComponent } from './map-popup-hover-single/map-popup-hover-single.component';
import { MapPopupHoverMultipleComponent } from './map-popup-hover-multiple/map-popup-hover-multiple.component';
import { MapPopupHoverContainerComponent } from './map-popup-hover-container/map-popup-hover-container.component';
import { MapPopupStableComponent } from './map-popup-stable/map-popup-stable.component';
import { BranchDetailsComponent } from './branch-details/branch-details.component';
import { BranchDetailsAddressComponent } from './branch-details-address/branch-details-address.component';
import { BranchDetailsOrgComponent } from './branch-details-org/branch-details-org.component';
import { LandingPageOverlayComponent } from './landing-page-overlay/landing-page-overlay.component';
import { CardBranchServicesComponent } from './card-branch-services/card-branch-services.component';
import { ClickOnReturnDirective } from './click-on-return.directive';
import { SearchFiltersSituationSectionComponent } from './search-filters-situation-section/search-filters-situation-section.component';
import { SearchFiltersMoreButtonComponent } from './search-filters-more-button/search-filters-more-button.component';
import { CardActionEmailComponent } from './card-action-email/card-action-email.component';
import { SearchFiltersButtonComponent } from './search-filters-button/search-filters-button.component';
import { ResponseSelectionWidgetComponent } from './response-selection-widget/response-selection-widget.component';
import { ResponseLinkyComponent } from './response-linky/response-linky.component';
import { SearchBarComponent } from './search/search-bar/search-bar.component';
import { AutocompleteResultsComponent } from './search/autocomplete-results/autocomplete-results.component';
import { AreaSearchSelectorComponent } from './area-search-selector/area-search-selector.component';
import { AreaSearchSelectorResultsComponent } from './area-search-selector-results/area-search-selector-results.component';
import { AreaSearchSelectorResultComponent } from './area-search-selector-result/area-search-selector-result.component';
import { AreaSearchSelectorResultPlaceComponent } from './area-search-selector-result-place/area-search-selector-result-place.component';
import { AreaSearchSelectorResultNationWideComponent } from './area-search-selector-result-nation-wide/area-search-selector-result-nation-wide.component';
import { AreaSearchSelectorResultMyLocationComponent } from './area-search-selector-result-my-location/area-search-selector-result-my-location.component';
import { MenuPopupMissingComponent } from './menu/menu-popup/menu-popup-missing/menu-popup-missing.component';
import { InteractionEventDirective } from './interaction-event.directive';
import { TagEndingComponent } from './result-card/tag-ending/tag-ending.component';
import { AreaSearchComponent } from './area-search/area-search.component';
import { SearchFiltersBarComponent } from './search-filters-bar/search-filters-bar.component';
import { AreaSearchNationalServicesCountComponent } from './area-search-national-services-count/area-search-national-services-count.component';
import { AreaSearchNationalServicesNotificationComponent } from './area-search-national-services-notification/area-search-national-services-notification.component';
import { MenuPopupAccordionComponent } from './menu/menu-popup/menu-popup-accordion/menu-popup-accordion.component';
import { SearchResultsPageComponent } from './search-results-page/search-results-page.component';
import { SrpStaticFiltersComponent } from './search-results-page/srp-static-filters/srp-static-filters.component';
import { SrpMapToggleComponent } from './search-results-page/srp-map-toggle/srp-map-toggle.component';
import { SrpAreaSearchButtonsComponent } from './search-results-page/srp-area-search-buttons/srp-area-search-buttons.component';
import { SearchResultsBranchesListComponent } from './search-results-branches-list/search-results-branches-list.component';
import {NgOptimizedImage} from "@angular/common";

@NgModule({
  declarations: [
    AppComponent,
    PageComponent,
    MapComponent,
    HomepageComponent,
    SearchComponent,
    ResultsDrawerComponent,
    ImageButtonComponent,
    CardComponent,
    ResponseComponent,
    SituationComponent,
    BranchContainerComponent,
    SearchboxHeaderComponent,
    SearchResultsComponent,
    ResultStackComponent,
    ResultCardComponent,
    SearchFiltersComponent,
    PointResultStackComponent,
    CardActionComponent,
    CardActionPhoneComponent,
    CardActionUrlComponent,
    CardActionNavComponent,
    SearchFilterCheckboxComponent,
    MenuIconComponent,
    MenuComponent,
    MenuPopupComponent,
    MenuPopupContactComponent,
    MenuPopupPartnersComponent,
    MenuPopupAboutComponent,
    MenuPopupIndexComponent,
    BranchHeaderComponent,
    MapWindowComponent,
    CardContainerComponent,
    QuickActionsComponent,
    DisclaimerFooterComponent,
    DesktopMenuLinksComponent,
    ArrowToTabDirective,
    MapPopupHoverSingleComponent,
    MapPopupHoverMultipleComponent,
    MapPopupHoverContainerComponent,
    MapPopupStableComponent,
    BranchDetailsComponent,
    BranchDetailsAddressComponent,
    BranchDetailsOrgComponent,
    LandingPageOverlayComponent,
    CardBranchServicesComponent,
    ClickOnReturnDirective,
    SearchFiltersSituationSectionComponent,
    SearchFiltersMoreButtonComponent,
    CardActionEmailComponent,
    SearchFiltersButtonComponent,
    ResponseSelectionWidgetComponent,
    ResponseLinkyComponent,
    SearchBarComponent,
    AutocompleteResultsComponent,
    AreaSearchSelectorComponent,
    AreaSearchSelectorResultsComponent,
    AreaSearchSelectorResultComponent,
    AreaSearchSelectorResultPlaceComponent,
    AreaSearchSelectorResultNationWideComponent,
    AreaSearchSelectorResultMyLocationComponent,
    MenuPopupMissingComponent,
    InteractionEventDirective,
    TagEndingComponent,
    AreaSearchComponent,
    SearchFiltersBarComponent,
    AreaSearchNationalServicesCountComponent,
    AreaSearchNationalServicesNotificationComponent,
    MenuPopupAccordionComponent,
    SearchResultsPageComponent,
    SrpStaticFiltersComponent,
    SrpMapToggleComponent,
    SrpAreaSearchButtonsComponent,
    SearchResultsBranchesListComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    NgOptimizedImage
  ],
  providers: [
    provideClientHydration(),
    {provide: RouteReuseStrategy, useClass: CustomReuseStrategy},
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler({
        showDialog: false,
      }),
    },
    {
      provide: Sentry.TraceService,
      deps: [Router],
    },
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {},
      deps: [Sentry.TraceService],
      multi: true,
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
