import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  usuarioIngresado: string = '';
  claveIngresada: string = '';


  usuarioValido: string = 'lmessi';
  claveValida: string = 'el10';

  constructor(private router: Router) {}

  enviar() {
    if (this.usuarioIngresado === this.usuarioValido && this.claveIngresada === this.claveValida) {
      console.log('✅ Login exitoso');
      console.log('Bienvenido,', this.usuarioIngresado);
      this.router.navigate(['/bienvenido'], { queryParams: { usuario: this.usuarioIngresado } });

    } else {
      console.log('❌ Usuario o contraseña incorrectos');
      this.router.navigate(['/error']);
    }
  }
}


