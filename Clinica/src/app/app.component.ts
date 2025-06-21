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
  group
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
    return outlet?.activatedRouteData?.['animation'] || '';
  }
}
