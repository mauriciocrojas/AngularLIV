import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type StepKey = 'start' | 'panel' | 'escapeDoor' | 'electrocutado' | 'gameOver' | 'win';

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

  steps: Record<StepKey, Step> = {
    start: {
      text: 'Estás atrapado en una nave espacial averiada. ¿Qué haces primero?',
      options: [
        { text: 'Revisar el panel de control', next: 'panel' },
        { text: 'Buscar una salida de emergencia', next: 'escapeDoor' }
      ]
    },
    panel: {
      text: 'El panel de control está quemado. ¿Intentás repararlo o buscar otra opción?',
      options: [
        { text: 'Intentar repararlo', next: 'electrocutado' },
        { text: 'Buscar otra sala', next: 'gameOver' }
      ]
    },
    escapeDoor: {
      text: 'Encuentras una puerta cerrada. ¿La forzás o buscas la llave?',
      options: [
        { text: 'Forzar puerta', next: 'gameOver' },
        { text: 'Buscar llave', next: 'win' }
      ]
    },
    electrocutado: {
      text: 'Te electrocutás al intentar repararlo. Fin del juego.',
      options: []
    },
    gameOver: {
      text: 'Tu decisión no funcionó, te quebraste el hombro al golpear la puerta. Fin del juego.',
      options: []
    },
    win: {
      text: '¡Encontraste la llave y escapaste con éxito! 🎉',
      options: []
    }
  };

  changeStep(next: StepKey) {
    this.currentStep = next;
  }

  reiniciarJuego() {
  this.currentStep = 'start';
}


  volverHome() {
    window.location.href = '/home'; // O usar el RouterLink si es necesario
  }
}
