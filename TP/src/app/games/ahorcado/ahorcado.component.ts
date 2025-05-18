import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameResultsService } from '../../services/game-results'; 

@Component({
  selector: 'app-ahorcado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ahorcado.component.html',
  styleUrls: ['./ahorcado.component.css']
})
export class AhorcadoComponent implements OnInit {
  abecedario: string[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  palabras: { palabra: string, pista: string }[] = [
    { palabra: 'ARGENTINA', pista: 'País campeón del mundo' },
    { palabra: 'PROGRAMACION', pista: 'Actividad informática donde se escribe código' },
    { palabra: 'VOLCAN', pista: 'Fenómeno geológico que erupciona' },
    { palabra: 'BIBLIOTECA', pista: 'Lugar lleno de libros' },
    { palabra: 'AEROPUERTO', pista: 'Lugar donde despegan aviones' }
  ];

  palabraSecreta: string = '';
  pista: string = '';
  palabraMostrada: string = '';
  letrasErradas: string[] = [];
  intentos: number = 5;
  juegoTerminado: boolean = false;
  mensaje: string = '';
  puntaje: number = 0;

  constructor(private gameResultsService: GameResultsService) {} // 👈 Inyección del servicio

  ngOnInit(): void {
    this.reiniciar();
  }

  elegirLetra(letra: string) {
    if (
      this.letrasErradas.includes(letra) ||
      this.palabraMostrada.includes(letra) ||
      this.juegoTerminado
    ) {
      return;
    }

    let nuevaPalabra = '';
    let letraEncontrada = false;

    for (let i = 0; i < this.palabraSecreta.length; i++) {
      if (this.palabraSecreta[i] === letra) {
        nuevaPalabra += letra + ' ';
        letraEncontrada = true;
      } else {
        nuevaPalabra += this.palabraMostrada[i * 2] + ' ';
      }
    }

    this.palabraMostrada = nuevaPalabra.trim();

    if (!letraEncontrada) {
      this.letrasErradas.push(letra);
      this.intentos--;
    }

    if (!this.palabraMostrada.includes('_')) {
      this.juegoTerminado = true;
      this.puntaje += this.intentos;
      this.mensaje = `¡Ganaste! Te quedaban ${this.intentos} vidas. Puntaje: ${this.puntaje}`;
      this.guardarResultado(); // 👈 Guardar al ganar
    }

    if (this.intentos <= 0) {
      this.juegoTerminado = true;
      this.mensaje = `¡Perdiste! La palabra era: ${this.palabraSecreta}`;
      this.puntaje = 0; // 👈 Puntaje cero si pierde
      this.guardarResultado(); // 👈 Guardar al perder
    }
  }

  reiniciar() {
    const seleccion = this.palabras[Math.floor(Math.random() * this.palabras.length)];
    this.palabraSecreta = seleccion.palabra;
    this.pista = seleccion.pista;
    this.palabraMostrada = '_ '.repeat(this.palabraSecreta.length).trim();
    this.letrasErradas = [];
    this.intentos = 5;
    this.juegoTerminado = false;
    this.mensaje = '';
    this.puntaje = 0;  // Resetear puntaje aquí
  }

  volverHome() {
    window.location.href = '/home';
  }

  private guardarResultado() {
    this.gameResultsService.saveResult('Ahorcado', this.puntaje);
  }
}
