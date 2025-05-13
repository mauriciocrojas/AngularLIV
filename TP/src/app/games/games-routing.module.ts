// games-routing.module.ts
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: 'ahorcado',
    loadComponent: () => import('./ahorcado/ahorcado.component').then(m => m.AhorcadoComponent)
  },
  {
    path: 'mayor-o-menor',
    loadComponent: () => import('./mayor-o-menor/mayor-o-menor.component').then(m => m.MayorMenorComponent)
  },
  {
    path: 'preguntados',
    loadComponent: () => import('./preguntados/preguntados.component').then(m => m.PreguntadosComponent)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GamesRoutingModule { }
