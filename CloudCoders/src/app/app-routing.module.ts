import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { LoginPage } from './login/login.page'; // ✅ Importamos directamente el componente standalone

const routes: Routes = [
  {
    path: '',
    component: LoginPage, // ✅ Usamos component en vez de loadComponent
  },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule)
  },
  {
    path: 'registro-cliente',
    loadChildren: () => import('./registro-cliente/registro-cliente.module').then( m => m.RegistroClientePageModule)
  },
  {
    path: 'lector',
    loadChildren: () => import('./lector/lector.module').then( m => m.LectorPageModule)
  },  {
    path: 'agregar-publicacion',
    loadChildren: () => import('./agregar-publicacion/agregar-publicacion.module').then( m => m.AgregarPublicacionPageModule)
  },





];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
