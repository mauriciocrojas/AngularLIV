import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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

  constructor(private http: HttpClient) { }

  getQuestions(): Observable<TriviaQuestion[]> {
    const triviaUrl = 'https://opentdb.com/api.php?amount=5&category=9&difficulty=easy&type=multiple';

    return this.http.get<any>(triviaUrl).pipe(
      map(response =>
        response.results.map((item: any) => {
          const decodedQuestion = this.decodeHTML(item.question);
          const decodedCorrect = this.decodeHTML(item.correct_answer);
          const decodedIncorrect = item.incorrect_answers.map((i: string) => this.decodeHTML(i));
          const options = this.shuffle([decodedCorrect, ...decodedIncorrect]);

          // Traducir la pregunta y las opciones
          const translatedQuestion = this.traducirPregunta(decodedQuestion);
          const translatedOptions = options.map(option => this.traducirPregunta(option));
          const translatedAnswer = this.traducirPregunta(decodedCorrect);

          return {
            question: translatedQuestion,
            options: translatedOptions,
            answer: translatedAnswer,
            imageUrl: ''
          };
        })
      )
    );
  }

  private traducirPregunta(question: string): string {
    // Traducción simple, puedes sustituir por una API de traducción si lo prefieres
    const traducciones: { [key: string]: string } = {
      'When someone is cowardly, they are said to have what color belly?': 'Cuando alguien es cobarde, se dice que tiene el vientre de qué color?',
      'What is the capital of France?': '¿Cuál es la capital de Francia?',
      'What is the largest planet in our Solar System?': '¿Cuál es el planeta más grande del sistema solar?',
      'What is 2 + 2?': '¿Cuánto es 2 + 2?',
      'Which planet is known as the Red Planet?': '¿Qué planeta es conocido como el planeta rojo?',
      'What is the largest ocean on Earth?': '¿Cuál es el océano más grande de la Tierra?',
      'How many continents are there?': '¿Cuántos continentes hay?',
      'What is the freezing point of water?': '¿Cuál es el punto de congelación del agua?',
      'Who painted the Mona Lisa?': '¿Quién pintó la Mona Lisa?',
      'What is the tallest mountain in the world?': '¿Cuál es la montaña más alta del mundo?',
      // Agregar más traducciones manualmente si es necesario
    };

    return traducciones[question] || question;  // Si no está traducida, devolvemos la pregunta tal cual
  }

  private decodeHTML(html: string): string {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }

  // Método para mezclar las opciones de respuesta
  private shuffle(array: string[]): string[] {
    return array.sort(() => Math.random() - 0.5);
  }
}
