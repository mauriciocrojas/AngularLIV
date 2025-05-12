// games-routing.module.ts
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AhorcadoComponent } from './ahorcado/ahorcado.component';  // Importamos el AhorcadoComponent
import { MayorMenorComponent } from './mayor-o-menor/mayor-o-menor.component'; // ComponenteMayorOMenor

const routes: Routes = [
  {
    path: 'ahorcado',
    loadComponent: () => import('./ahorcado/ahorcado.component').then(m => m.AhorcadoComponent)
  },
  {
    path: 'mayor-o-menor',
    loadComponent: () => import('./mayor-o-menor/mayor-o-menor.component').then(m => m.MayorMenorComponent)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GamesRoutingModule { }
