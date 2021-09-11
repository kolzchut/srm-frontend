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
    FilterButtonComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
