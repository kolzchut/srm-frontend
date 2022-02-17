import { NgModule } from '@angular/core';
import { BrowserModule, BrowserTransferStateModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainComponent } from './main/main.component';
import { DrawerComponent } from './drawer/drawer.component';
import { MapComponent } from './map/map.component';
import { FilteringComponent } from './filtering/filtering.component';
import { SearchBoxComponent } from './filtering/search-box/search-box.component';
import { FilterBarComponent } from './filtering/filter-bar/filter-bar.component';
import { MenuButtonComponent } from './filtering/menu-button/menu-button.component';
import { ImageButtonComponent } from './common/image-button/image-button.component';
import { FilterButtonComponent } from './filtering/filter-bar/filter-button/filter-button.component';
import { HttpClientModule } from '@angular/common/http';
import { ServiceListComponent } from './drawer/service-list/service-list.component';
import { ServiceCardComponent } from './drawer/service-card/service-card.component';
import { ChipComponent } from './common/chip/chip.component';
import { SingleServiceComponent } from './drawer/single-service/single-service.component';
import { CardWhatComponent } from './common/card-what/card-what.component';
import { CardWhereComponent } from './common/card-where/card-where.component';
import { CardTagsComponent } from './common/card-tags/card-tags.component';
import { CardButtonComponent } from './common/card-button/card-button.component';
import { SingleComponent } from './drawer/strip/single/single.component';
import { SearchAutocompleteComponent } from './filtering/search-autocomplete/search-autocomplete.component';
import { FilteringConfigComponent } from './filtering/filtering-config/filtering-config.component';
import { FormsModule } from '@angular/forms';
import { AutocompleteSectionComponent } from './filtering/search-autocomplete/autocomplete-section/autocomplete-section.component';
import { AutocompleteResultComponent } from './filtering/search-autocomplete/autocomplete-result/autocomplete-result.component';
import { StripMultipleComponent } from './drawer/strip/strip-multiple/strip-multiple.component';
import { SituationGroupFilterComponent } from './filtering/filtering-config/situation-group-filter/situation-group-filter.component';
import { SituationEditorComponent } from './filtering/filtering-config/situation-editor/situation-editor.component';
import { CardActionComponent } from './common/card-action/card-action.component';
import { FilteringResultsButtonComponent } from './filtering/filtering-results-button/filtering-results-button.component';
import { PresetStripComponent } from './common/preset-strip/preset-strip.component';
import { PresetCardComponent } from './common/preset-card/preset-card.component';
import { DisclaimerComponent } from './disclaimer/disclaimer.component';
import { MenuComponent } from './menu/menu.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { PopupMultipleComponent } from './drawer/strip/popup-multiple/popup-multiple.component';
import { MenuPopupComponent } from './menu/menu-popup/menu-popup.component';
import { MenuBackdropComponent } from './menu/menu-backdrop/menu-backdrop.component';
import { MenuPopupContactComponent } from './menu/menu-popup/menu-popup-contact/menu-popup-contact.component';
import { MenuPopupPartnersComponent } from './menu/menu-popup/menu-popup-partners/menu-popup-partners.component';
import { MenuPopupAboutComponent } from './menu/menu-popup/menu-popup-about/menu-popup-about.component';
import { DisclaimerContentsComponent } from './disclaimer/disclaimer-contents/disclaimer-contents.component';

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    DrawerComponent,
    MapComponent,
    FilteringComponent,
    SearchBoxComponent,
    FilterBarComponent,
    MenuButtonComponent,
    ImageButtonComponent,
    FilterButtonComponent,
    ServiceListComponent,
    ServiceCardComponent,
    ChipComponent,
    SingleServiceComponent,
    CardWhatComponent,
    CardWhereComponent,
    CardTagsComponent,
    CardButtonComponent,
    SingleComponent,
    SearchAutocompleteComponent,
    FilteringConfigComponent,
    AutocompleteSectionComponent,
    AutocompleteResultComponent,
    StripMultipleComponent,
    SituationGroupFilterComponent,
    SituationEditorComponent,
    CardActionComponent,
    FilteringResultsButtonComponent,
    PresetStripComponent,
    PresetCardComponent,
    DisclaimerComponent,
    MenuComponent,
    PageNotFoundComponent,
    PopupMultipleComponent,
    MenuPopupComponent,
    MenuBackdropComponent,
    MenuPopupContactComponent,
    MenuPopupPartnersComponent,
    MenuPopupAboutComponent,
    DisclaimerContentsComponent,
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    BrowserTransferStateModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
