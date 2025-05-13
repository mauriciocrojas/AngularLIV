import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ahorcado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ahorcado.component.html',
  styleUrls: ['./ahorcado.component.css']
})
export class AhorcadoComponent {
  // Declarar el abecedario como un arreglo de letras
  abecedario: string[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Inicializar las variables del juego
  palabraSecreta: string = 'ARGENTINA'; // Palabra secreta
  palabraMostrada: string = '_ '.repeat(this.palabraSecreta.length).trim(); // Palabra oculta
  letrasErradas: string[] = []; // Letras incorrectas
  intentos: number = 5; // Intentos restantes
  juegoTerminado: boolean = false; // Indicador de si el juego terminó
  mensaje: string = ''; // Mensaje de estado del juego

  // Lógica para elegir una letra
  elegirLetra(letra: string) {
    if (this.letrasErradas.includes(letra) || this.palabraMostrada.includes(letra) || this.juegoTerminado) {
      return; // Si la letra ya fue adivinada, errónea, o el juego terminó, no hacer nada
    }

    let nuevaPalabra = '';
    let letraEncontrada = false;

    // Revisar si la letra está en la palabra secreta
    for (let i = 0; i < this.palabraSecreta.length; i++) {
      if (this.palabraSecreta[i] === letra) {
        nuevaPalabra += letra + ' ';
        letraEncontrada = true;
      } else {
        nuevaPalabra += this.palabraMostrada[i * 2] + ' '; // Mantener las letras no adivinadas
      }
    }

    this.palabraMostrada = nuevaPalabra.trim();

    // Si la letra no se encontró, restar un intento
    if (!letraEncontrada) {
      this.letrasErradas.push(letra);
      this.intentos--;
    }

    // Verificar si se ha ganado el juego
    if (!this.palabraMostrada.includes('_')) {
      this.juegoTerminado = true;
      this.mensaje = '¡Ganaste!'; // Mostrar mensaje de victoria
    }

    // Verificar si se ha perdido el juego
    if (this.intentos <= 0) {
      this.juegoTerminado = true;
      this.mensaje = '¡Perdiste!'; // Mostrar mensaje de derrota
    }
  }

  // Lógica para reiniciar el juego
  reiniciar() {
    this.palabraMostrada = '_ '.repeat(this.palabraSecreta.length).trim();
    this.letrasErradas = [];
    this.intentos = 5;
    this.juegoTerminado = false;
    this.mensaje = ''; // Limpiar el mensaje
  }

  volverHome() {
    window.location.href = '/home'; // O usar el RouterLink si es necesario
  }
}
