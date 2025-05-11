// games.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamesRoutingModule } from './games-routing.module';  // Asegúrate de que esté importado el routing del módulo de juegos
import { AhorcadoComponent } from './ahorcado/ahorcado.component';  // Importamos el componente Ahorcado

@NgModule({
  imports: [
    CommonModule,
    GamesRoutingModule  // Importamos las rutas de juegos
  ],
  declarations: [
    AhorcadoComponent  // Declaramos el AhorcadoComponent en el módulo de juegos
  ]
})
export class GamesModule { }
