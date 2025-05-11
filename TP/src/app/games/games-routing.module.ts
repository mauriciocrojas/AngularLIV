// games-routing.module.ts
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AhorcadoComponent } from './ahorcado/ahorcado.component';  // Importamos el AhorcadoComponent

const routes: Routes = [
  {
    path: 'ahorcado',
    component: AhorcadoComponent  // Cargamos directamente el componente
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GamesRoutingModule { }
