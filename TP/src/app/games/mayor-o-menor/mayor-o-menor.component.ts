import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Carta {
  valor: number;
  palo: string;
}

@Component({
  selector: 'app-mayor-menor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mayor-o-menor.component.html',
  styleUrls: ['./mayor-o-menor.component.css'],
})
export class MayorMenorComponent implements OnInit, OnDestroy {
  mazo: Carta[] = [];
  cartaActual?: Carta;
  siguienteCarta?: Carta;
  puntaje = 0;
  mensaje = '';
  juegoTerminado = false;
  mostrarSiguienteCarta = false;
  cartaRecogidaTapada = true;
  palos = ['♠', '♥', '♦', '♣'];
  timerId: any;
  respuestaJugador: string = '';

  constructor() { }

  ngOnInit(): void {
    this.iniciarJuego();
  }

  ngOnDestroy(): void {
    this.limpiarTemporizador();
  }

  iniciarJuego() {
    this.mazo = [];
    for (const palo of this.palos) {
      for (let valor = 1; valor <= 12; valor++) {
        this.mazo.push({ valor, palo });
      }
    }
    this.mazo = this.barajarMazo(this.mazo);
    this.cartaActual = this.mazo.pop();
    this.siguienteCarta = this.mazo.pop();
    this.puntaje = 0;
    this.mensaje = '';
    this.juegoTerminado = false;
    this.mostrarSiguienteCarta = false;
    this.cartaRecogidaTapada = true;
    this.respuestaJugador = '';
  }

  barajarMazo(array: Carta[]): Carta[] {
    let currentIndex = array.length,
      randomIndex;
    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex],
      ];
    }
    return array;
  }

  adivinar(respuesta: 'mayor' | 'menor' | 'igual') {
    if (!this.cartaActual || !this.siguienteCarta || this.juegoTerminado) return;

    this.respuestaJugador = respuesta;

    let correcta: 'mayor' | 'menor' | 'igual' = 'igual';
    if (this.siguienteCarta.valor > this.cartaActual.valor) {
      correcta = 'mayor';
    } else if (this.siguienteCarta.valor < this.cartaActual.valor) {
      correcta = 'menor';
    }

    if (respuesta === correcta) {
      this.puntaje++;
      this.mensaje = '¡Correcto!';
    } else {
      this.mensaje = `¡Perdiste! Era ${correcta.toUpperCase()}. Puntaje final: ${this.puntaje}`;
      this.juegoTerminado = true;
    }

    this.mostrarSiguienteCarta = true;
    this.cartaRecogidaTapada = false;

    this.limpiarTemporizador();
    this.timerId = setTimeout(() => {
      if (!this.juegoTerminado) {
        this.cartaActual = this.siguienteCarta;
        this.siguienteCarta = this.mazo.pop();
        this.cartaRecogidaTapada = true;
        this.mostrarSiguienteCarta = false;
        this.respuestaJugador = '';
        this.mensaje = ''; // Limpiar el mensaje aquí
      }
      this.timerId = null;
    }, 2000);
  }

  limpiarTemporizador() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  reiniciar() {
    this.limpiarTemporizador();
    this.iniciarJuego();
  }

  volverHome() {
    window.location.href = '/home'; // O usar el RouterLink si es necesario
  }
}


