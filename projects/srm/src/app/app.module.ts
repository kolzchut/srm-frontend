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
    SearchResultsComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    BrowserTransferStateModule,
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
