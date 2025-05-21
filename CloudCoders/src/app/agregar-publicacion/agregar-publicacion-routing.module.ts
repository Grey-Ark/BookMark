import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AgregarPublicacionPage } from './agregar-publicacion.page';

const routes: Routes = [
  {
    path: '',
    component: AgregarPublicacionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AgregarPublicacionPageRoutingModule {}
