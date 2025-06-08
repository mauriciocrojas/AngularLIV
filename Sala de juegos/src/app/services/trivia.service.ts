import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { PixabayService } from './pixabay.service'; // Asegurate que la ruta sea correcta

export interface TriviaQuestion {
  question: string;
  options: string[];
  answer: string;
  imageUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class TriviaService {

private preguntas: Omit<TriviaQuestion, 'imageUrl'>[] = [
  {
    question: '¿Dónde se ubica la torre Eiffel?',
    options: ['Madrid', 'Roma', 'París', 'Londres'],
    answer: 'París'
  },
  {
    question: '¿Cuál es el planeta más grande del sistema solar?',
    options: ['Tierra', 'Júpiter', 'Saturno', 'Marte'],
    answer: 'Júpiter'
  },
  {
    question: '¿Cuánto es 5 x 6?',
    options: ['30', '11', '25', '35'],
    answer: '30'
  },
  {
    question: '¿Qué animal es conocido como el rey de la selva?',
    options: ['Tigre', 'Elefante', 'León', 'Gorila'],
    answer: 'León'
  },
  {
    question: '¿Quién pintó la Mona Lisa?',
    options: ['Van Gogh', 'Da Vinci', 'Picasso', 'Rembrandt'],
    answer: 'Da Vinci'
  },
  {
    question: 'Las plantas realizan la fotosíntesis, ¿es un proceso de?',
    options: ['Respiración', 'Absorción de agua', 'Producción de energía', 'Digestión'],
    answer: 'Producción de energía'
  },
  {
    question: '¿Quién fue Albert Einstein?',
    options: ['Un pintor', 'Un físico', 'Un matemático', 'Un escritor'],
    answer: 'Un físico'
  }
];


  constructor(private pixabayService: PixabayService) {}

  getQuestions(): Observable<TriviaQuestion[]> {
    return forkJoin(
      this.preguntas.map(p =>
        this.pixabayService.searchImage(this.getKeyword(p.question)).pipe(
          map(res => {
            const imageUrl = res.hits?.[0]?.webformatURL || '';
            return { ...p, imageUrl };
          }),
          catchError(() => of({ ...p, imageUrl: '' })) // por si falla la API
        )
      )
    );
  }

  private getKeyword(question: string): string {
    // Extrae una palabra clave relevante de la pregunta

    return question.split(' ')[0]; // fallback: primera palabra
  }
}
