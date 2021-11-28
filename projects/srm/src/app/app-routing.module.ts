import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './main/main.component';

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
    path: '', component: MainComponent,
  }

];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    initialNavigation: 'enabled'
})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
