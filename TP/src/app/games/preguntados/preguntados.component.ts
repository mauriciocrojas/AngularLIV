import { Component, OnInit } from '@angular/core';
import { TriviaService, TriviaQuestion } from '../../../app/services/trivia.service';
import { PixabayService } from '../../../app/services/pixabay.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';  // Importar Router

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

  constructor(
    private triviaService: TriviaService,
    private pixabayService: PixabayService,
    private router: Router  // Inyectar Router
  ) { }

  ngOnInit(): void {
    this.triviaService.getQuestions().subscribe(data => {
      this.preguntas = data.filter((item: any) => item.question); // Filtrar preguntas que no estén vacías

      // Buscar imágenes para cada pregunta
      this.preguntas.forEach((pregunta, index) => {
        this.pixabayService.searchImage(pregunta.question).subscribe(response => {
          // Asignar la primera imagen que devuelve la API
          this.preguntas[index].imageUrl = response.hits[0]?.webformatURL || '';
        });
      });
      this.cargando = false;
    });
  }

  seleccionarOpcion(opcion: string) {
    this.opcionSeleccionada = opcion;
    this.respuestaCorrecta = opcion === this.preguntaActual.answer;
    this.mostrarResultado = true;
  }

  siguientePregunta() {
    this.opcionSeleccionada = null;
    this.mostrarResultado = false;
    this.respuestaCorrecta = null;

    // Incrementar solo si no se ha llegado al final
    if (this.preguntaActualIndex < this.preguntas.length - 1) {
      this.preguntaActualIndex++;
      console.log('Pregunta Actual Index:', this.preguntaActualIndex);
      if (this.preguntaActualIndex == 6) {
        // Esto se ejecuta cuando se llega al final de las preguntas
        console.log('Juego finalizado');
        this.mostrarResultado = false;
      }
    }
  }
  reiniciarJuego() {
    // Reiniciar el juego a su estado inicial
    this.preguntaActualIndex = 0;
    this.opcionSeleccionada = null;
    this.mostrarResultado = false;
    this.respuestaCorrecta = null;
  }

  volverHome() {
    window.location.href = '/home'; // O usar el RouterLink si es necesario
  }

  get preguntaActual(): TriviaQuestion {
    return this.preguntas[this.preguntaActualIndex];
  }
}
