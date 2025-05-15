import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type StepKey = 'start' | 'panel' | 'escapeDoor' | 'cafetera' | 'enfermeria' | 'electrocutado' | 'gameOver' | 'win';

interface Step {
  text: string;
  options: { text: string; next: StepKey }[];
}

@Component({
  selector: 'app-escape-galactico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './escape-galactico.component.html',
  styleUrl: './escape-galactico.component.css'
})
export class EscapeGalacticoComponent {
  currentStep: StepKey = 'start';
  score = 0;
  gameEnded = false;

  steps: Record<StepKey, Step> = {
    start: {
      text: 'Te despertás en una nave espacial apunto de explotar. Todo tiembla y hay olor a quemado. ¿Qué hacés?',
      options: [
        { text: 'Revisar el panel de control', next: 'panel' },
        { text: 'Buscar una salida de emergencia', next: 'escapeDoor' },
      ]
    },
    panel: {
      text: 'Llegás al panel de control. Está chispeando y parece dañado. ¿Qué hacés?',
      options: [
        { text: 'Intentar repararlo igual', next: 'electrocutado' },
        { text: 'Darle un golpazo por la bronca', next: 'gameOver' }
      ]
    },
    escapeDoor: {
      text: 'Encontrás una puerta de emergencia bloqueda con un candado electrónico. ¿Qué hacés?',
      options: [
        { text: 'Forzarla con una barra', next: 'gameOver' },
        { text: 'Buscar la llave magnética', next: 'cafetera' }
      ]
    },
    cafetera: {
      text: 'Vas a la sala común. No hay nadie, pero ves una un ducto de ventilación en el piso.',
      options: [
        { text: 'Meterte por los ductos de ventilación', next: 'enfermeria' },
        { text: 'Seguir buscando en la nave', next: 'gameOver' }
      ]
    },
    enfermeria: {
      text: 'Entrás a la enfermería desde los ductos. Encontrás un maletín con una tarjeta magnética.',
      options: [
        { text: 'Volver a la puerta de emergencia y probar la tarjeta', next: 'win' },
        { text: 'Explorar más la enfermería', next: 'gameOver' }
      ]
    },
    electrocutado: {
      text: 'Tocás el panel y te da una descarga. Te desmayás en el acto.',
      options: []
    },
    gameOver: {
      text: 'Lo que hiciste no funcionó. La nave colapsa con vos dentro.',
      options: []
    },
    win: {
      text: '¡La tarjeta funciona! Entrás al módulo de escape y lo lanzás justo antes de que la nave explote. Flotás en el espacio, pero estás vivo. ¡Buen trabajo!',
      options: []
    }
  };

  changeStep(next: StepKey) {
    if (this.steps[next].options.length > 0) {
      this.score += 10;
    } else {
      this.gameEnded = true;
    }
    this.currentStep = next;
  }

  reiniciarJuego() {
    this.currentStep = 'start';
    this.score = 0;
    this.gameEnded = false;
  }

  volverHome() {
    window.location.href = '/home'; // O usar Router si preferís hacerlo con Angular Router
  }
}
