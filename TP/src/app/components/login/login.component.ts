import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  email: string = "";
  password: string = "";
  errorMessage: string = ""; // <-- Para mostrar errores

  constructor(private router: Router) {}

  async login() {
    this.errorMessage = ""; // Limpiar mensaje anterior

    if (!this.email || !this.password) {
      this.errorMessage = "Por favor, complete todos los campos.";
      return;
    }

    if (!this.validateEmail(this.email)) {
      this.errorMessage = "Ingrese un email válido.";
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: this.email,
      password: this.password,
    });

    if (error) {
      this.errorMessage = "Email o contraseña incorrectos.";
      console.error('Error:', error.message);
    } else {
            // Registrar el log de ingreso exitoso
            const { error: logError } = await supabase.from('login_logs').insert({
              email: this.email,
              login_date: new Date().toISOString()
            });

            if (logError) {
              console.error('Error registrando el log de login:', logError.message);
              // Muestro error, pero no frenaría el login
            }

            this.router.navigate(['/home']);
          }
  }

  preloadData() {
    this.email = 'mauriciocc.rojas@gmail.com';
    this.password = '123456';
  }

  validateEmail(email: string) {
    // Validación simple de email
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  }

}
