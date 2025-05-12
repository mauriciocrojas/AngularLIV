// games.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamesRoutingModule } from './games-routing.module';  // Routing del módulo de juegos
// import { AhorcadoComponent } from './ahorcado/ahorcado.component';  // Componente Ahorcado
// import { MayorMenorComponent } from './mayor-o-menor/mayor-o-menor.component'; // ComponenteMayorOMenor

@NgModule({
  imports: [
    CommonModule,
    GamesRoutingModule  // Importamos las rutas de juegos
  ],
  declarations: [
    ]
})
export class GamesModule { }
