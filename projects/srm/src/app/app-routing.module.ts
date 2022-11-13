import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { PageComponent } from './page/page.component';

const routes: Routes = [
  {
    path: 'about', component: PageComponent, data: {group: 'flow', stage: 'about'},
  },
  {
    path: 'about/kolsherut', component: PageComponent, data: {group: 'flow', stage: 'about:about'},
  },
  {
    path: 'about/partners', component: PageComponent, data: {group: 'flow', stage: 'about:partners'},
  },
  {
    path: 'about/contact', component: PageComponent, data: {group: 'flow', stage: 'about:contact'},
  },
  {
    path: 'q', component: PageComponent, data: {group: 'flow', stage: 'search'},
  },
  {
    path: 's/:query', component: PageComponent, data: {group: 'flow', stage: 'search-results'},
  },
  {
    path: 's', component: PageComponent, data: {group: 'flow', stage: 'search-results'},
  },
  {
    path: 'p/:point', component: PageComponent, data: {group: 'flow', stage: 'point'},
  },
  {
    path: 'c/:card/p/:point', component: PageComponent, data: {group: 'flow', stage: 'point'},
  },
  {
    path: 'c/:card', component: PageComponent, data: {group: 'flow', stage: 'card'},
  },
  {
    path: '', component: PageComponent, data: {group: 'flow', stage: 'homepage'},
  },
  {
    path: '**', component: PageNotFoundComponent,
  }

];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    initialNavigation: 'enabled',
    // enableTracing: true
})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
