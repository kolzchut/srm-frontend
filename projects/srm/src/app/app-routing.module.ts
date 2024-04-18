import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { PageComponent } from './page/page.component';

const routes: Routes = [
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
    path: 'about/missing', component: PageComponent, data: {group: 'flow', stage: 'about:missing'},
  },
  {
    path: 'about/index', component: PageComponent, data: {group: 'flow', stage: 'about:index'},
  },
  {
    path: 'q', component: PageComponent, data: {group: 'flow', stage: 'search'},
  },
  {
    path: 's/:query/c/:card/p/:point', component: PageComponent, data: {group: 'flow', stage: 'point'},
  },
  {
    path: 's/:query/c/:card', component: PageComponent, data: {group: 'flow', stage: 'card'},
  },
  {
    path: 's/:query/p/:point', component: PageComponent, data: {group: 'flow', stage: 'point'},
  },
  {
    path: 's/:query', component: PageComponent, data: {group: 'flow', stage: 'search-results'},
  },
  {
    path: 'c/:card/p/:point', component: PageComponent, data: {group: 'flow', stage: 'point'},
  },
  {
    path: 'c/:card', component: PageComponent, data: {group: 'flow', stage: 'card'},
  },
  {
    path: 'p/:point', component: PageComponent, data: {group: 'flow', stage: 'point'},
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
    initialNavigation: 'enabledBlocking',
    // enableTracing: true
})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
