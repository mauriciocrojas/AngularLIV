import { Component, OnInit } from '@angular/core';
import { TriviaService, TriviaQuestion } from '../../../app/services/trivia.service';
import { PixabayService } from '../../../app/services/pixabay.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GameResultsService } from '../../../app/services/game-results'; // ✅ Importado

@Component({
  selector: 'app-preguntados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './preguntados.component.html',
  styleUrls: ['./preguntados.component.css']
})
export class PreguntadosComponent implements OnInit {
  preguntas: TriviaQuestion[] = [];
  preguntaActualIndex = 0;
  opcionSeleccionada: string | null = null;
  mostrarResultado = false;
  respuestaCorrecta: boolean | null = null;
  cargando = true;
  puntuacion = 0;
  juegoFinalizado = false;
  puntajeRegistrado = false; // ✅ Flag para evitar múltiples guardados

  constructor(
    private triviaService: TriviaService,
    private pixabayService: PixabayService,
    private router: Router,
    private gameResultsService: GameResultsService // ✅ Inyectado
  ) { }

  ngOnInit(): void {
    this.triviaService.getQuestions().subscribe(data => {
      this.preguntas = data.filter((item: any) => item.question);
      this.preguntas.forEach((pregunta, index) => {
        this.pixabayService.searchImage(pregunta.question).subscribe(response => {
          this.preguntas[index].imageUrl = response.hits[0]?.webformatURL || '';
        });
      });
      this.cargando = false;
    });
  }

  seleccionarOpcion(opcion: string) {
    if (this.mostrarResultado || this.juegoFinalizado) return;

    this.opcionSeleccionada = opcion;
    const esCorrecta = opcion === this.preguntaActual.answer;
    this.respuestaCorrecta = esCorrecta;
    if (esCorrecta) {
      this.puntuacion++;
    }
    this.mostrarResultado = true;
  }

  siguientePregunta() {
    this.opcionSeleccionada = null;
    this.mostrarResultado = false;
    this.respuestaCorrecta = null;

    if (this.preguntaActualIndex < this.preguntas.length - 1) {
      this.preguntaActualIndex++;
    } else {
      this.juegoFinalizado = true;

      // ✅ Guardar el resultado solo una vez
      if (!this.puntajeRegistrado) {
        this.gameResultsService.saveResult('Preguntados', this.puntuacion);
        this.puntajeRegistrado = true;
      }
    }
  }

  reiniciarJuego() {
    this.preguntaActualIndex = 0;
    this.opcionSeleccionada = null;
    this.mostrarResultado = false;
    this.respuestaCorrecta = null;
    this.puntuacion = 0;
    this.juegoFinalizado = false;
    this.puntajeRegistrado = false; // ✅ Reset al reiniciar
  }

  volverHome() {
    window.location.href = '/home';
  }

  get preguntaActual(): TriviaQuestion {
    return this.preguntas[this.preguntaActualIndex];
  }
}
