import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

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
    SingleComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
