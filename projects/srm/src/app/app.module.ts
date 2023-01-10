import { NgModule } from '@angular/core';
import { BrowserModule, BrowserTransferStateModule } from '@angular/platform-browser';

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
import { MenuPopupComponent } from './menu/menu-popup/menu-popup.component';
import { BranchHeaderComponent } from './branch-header/branch-header.component';
import { MapWindowComponent } from './map-window/map-window.component';
import { CardContainerComponent } from './card-container/card-container.component';
import { QuickActionsComponent } from './quick-actions/quick-actions.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DisclaimerFooterComponent } from './disclaimer-footer/disclaimer-footer.component';
import { DesktopMenuLinksComponent } from './desktop-menu-links/desktop-menu-links.component';

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
    BranchHeaderComponent,
    MapWindowComponent,
    CardContainerComponent,
    QuickActionsComponent,
    DisclaimerFooterComponent,
    DesktopMenuLinksComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    BrowserTransferStateModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [
    {provide: RouteReuseStrategy, useClass: CustomReuseStrategy}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
