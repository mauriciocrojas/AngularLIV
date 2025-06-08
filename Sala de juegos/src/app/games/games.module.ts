// src/app/games/games.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamesRoutingModule } from './games-routing.module';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [
    CommonModule,
    GamesRoutingModule,
    HttpClientModule
  ]
})
export class GamesModule { }
