import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './main/main.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';

const routes: Routes = [
  {
    path: 'p/:place', component: MainComponent,
  },
  {
    path: 'r/:response', component: MainComponent,
  },
  {
    path: 'c/:card', component: MainComponent,
  },
  {
    path: 'o/:org', component: MainComponent,
  },
  {
    path: '', component: MainComponent,
  },
  {
    path: '**', component: PageNotFoundComponent,
  }

];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    initialNavigation: 'enabled'
})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
