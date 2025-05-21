import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LectorPage } from './lector.page';

const routes: Routes = [
  {
    path: '',
    component: LectorPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LectorPageRoutingModule {}
