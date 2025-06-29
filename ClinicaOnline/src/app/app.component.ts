import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RecaptchaModule, RECAPTCHA_SETTINGS, RecaptchaSettings } from 'ng-recaptcha';

import {
  trigger,
  transition,
  style,
  query,
  animate,
  group,
  animateChild // Importar animateChild
} from '@angular/animations';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    FormsModule,
    HttpClientModule,
    RecaptchaModule
  ],
  providers: [
    {
      provide: RECAPTCHA_SETTINGS,
      useValue: {
        siteKey: 'TU_SITE_KEY_AQUÍ'
      } as RecaptchaSettings
    }
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [
    trigger('routeAnimations', [
      // *** NUEVA ANIMACIÓN: Para entrar a 'Mi Perfil' (de derecha a izquierda) ***
      transition('* => MiPerfilPage', [
        style({ position: 'relative' }),
        query(':enter, :leave', [
          style({
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%'
          })
        ], { optional: true }),
        query(':enter', [
          style({ transform: 'translateX(100%)' }) // La nueva página (Mi Perfil) entra desde la derecha
        ], { optional: true }),
        query(':leave', animateChild(), { optional: true }), // Permitir animaciones de hijos que salen
        group([
          query(':leave', [
            animate('600ms ease-out', style({ transform: 'translateX(-100%)' })) // La página anterior se desliza a la izquierda
          ], { optional: true }),
          query(':enter', [
            animate('600ms ease-out', style({ transform: 'translateX(0%)' })) // Mi Perfil se desliza a su posición final
          ], { optional: true })
        ]),
        query(':enter', animateChild(), { optional: true }), // Permitir animaciones de hijos que entran
      ]),

      // *** OPCIONAL: Animación para SALIR de 'Mi Perfil' (para simetría) ***
      // Si quieres que al salir de Mi Perfil la página también se deslice de forma coherente
      // (Mi Perfil sale a la derecha, la nueva página entra de la izquierda).
      // Si comentas o eliminas este bloque, al salir de Mi Perfil se usará la animación global de fade.
      transition('MiPerfilPage => *', [
        style({ position: 'relative' }),
        query(':enter, :leave', [
          style({
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%'
          })
        ], { optional: true }),
        query(':enter', [
          style({ transform: 'translateX(-100%)' }) // La nueva página entra desde la izquierda
        ], { optional: true }),
        query(':leave', animateChild(), { optional: true }),
        group([
          query(':leave', [
            animate('600ms ease-out', style({ transform: 'translateX(100%)' })) // Mi Perfil se desliza a la derecha
          ], { optional: true }),
          query(':enter', [
            animate('600ms ease-out', style({ transform: 'translateX(0%)' })) // La nueva página se desliza a su posición final
          ], { optional: true })
        ]),
        query(':enter', animateChild(), { optional: true }),
      ]),

      // *** ANIMACIÓN GLOBAL EXISTENTE: Para todas las demás transiciones ***
      // Esta animación de fade se aplica a cualquier otra ruta que no tenga una animación específica definida.
      transition('* <=> *', [
        style({ position: 'relative' }),
        query(':enter, :leave', [
          style({
            position: 'absolute',
            width: '100%',
            top: 0,
            left: 0,
          }),
        ], { optional: true }),
        query(':enter', [
          style({ opacity: 0 }),
        ], { optional: true }),
        group([
          query(':leave', [
            animate('600ms ease-out', style({ opacity: 0 })),
          ], { optional: true }),
          query(':enter', [
            animate('600ms ease-out', style({ opacity: 1 })),
          ], { optional: true }),
        ]),
      ]),
    ]),
  ]
})
export class AppComponent {
  title = 'Clinica Online';

  prepareRoute(outlet: RouterOutlet) {
    // Asegura que se retorne el valor de 'animation' o una cadena vacía si no existe.
    // Esto es crucial para que el trigger de animación funcione.
    return outlet?.activatedRouteData?.['animation'] || '';
  }
}