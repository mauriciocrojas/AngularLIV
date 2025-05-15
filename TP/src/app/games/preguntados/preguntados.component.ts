import { Component, OnInit } from '@angular/core';
import { TriviaService, TriviaQuestion } from '../../../app/services/trivia.service';
import { PixabayService } from '../../../app/services/pixabay.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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

  constructor(
    private triviaService: TriviaService,
    private pixabayService: PixabayService,
    private router: Router
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
    }
  }

  reiniciarJuego() {
    this.preguntaActualIndex = 0;
    this.opcionSeleccionada = null;
    this.mostrarResultado = false;
    this.respuestaCorrecta = null;
    this.puntuacion = 0;
    this.juegoFinalizado = false;
  }

  volverHome() {
    window.location.href = '/home';
  }

  get preguntaActual(): TriviaQuestion {
    return this.preguntas[this.preguntaActualIndex];
  }
}
