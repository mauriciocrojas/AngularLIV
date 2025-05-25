import { Component } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';  // Importamos Router para la navegación

@Component({
  selector: 'app-encuesta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './encuesta.component.html',
  styleUrls: ['./encuesta.component.css']

})
export class EncuestaComponent {
  fullName = '';
  age: number | null = null;
  phone = '';
  q1 = '';
  q2Ahorcado = false;
  q2Preguntados = false;
  q2Escape = false;
  q2MayorMenor = false;
  q3 = '';
  errorMessage = '';
  successMessage = '';

  private supabase: SupabaseClient;

  constructor(private router: Router) {
    this.supabase = createClient(environment.apiUrl, environment.publicAnonKey);
  }

  async enviarEncuesta() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.fullName || !this.age || !this.phone || !this.q1 || !this.q3) {
      this.errorMessage = 'Todos los campos son obligatorios.';
      return;
    }

    if (this.age < 18 || this.age > 99) {
      this.errorMessage = 'La edad debe ser entre 18 y 99 años.';
      return;
    }

    if (!/^\d{1,10}$/.test(this.phone)) {
      this.errorMessage = 'El número de teléfono debe contener solo números (máximo 10).';
      return;
    }

    const q2 = [
      this.q2Ahorcado ? 'Ahorcado' : '',
      this.q2Preguntados ? 'Preguntados' : '',
      this.q2Escape ? 'Escape Galáctico' : '',
      this.q2MayorMenor ? 'Mayor o Menor' : ''
    ]
      .filter(Boolean)
      .join(', ');

    const { data: session } = await this.supabase.auth.getSession();
    const user = session.session?.user;

    if (!user) {
      this.errorMessage = 'Debés estar logueado para enviar la encuesta.';
      return;
    }

    const { error } = await this.supabase.from('satisfaction_survey').insert([
      {
        full_name: this.fullName,
        age: this.age,
        phone: this.phone,
        question1: this.q1,
        question2: q2,
        question3: this.q3,
        user_id: user.id
      }
    ]);

    if (error) {
      this.errorMessage = 'Error al enviar la encuesta. Intentalo de nuevo.';
      console.error(error);
    } else {
      this.successMessage = '¡Gracias por completar la encuesta!';
      this.resetForm();
    }
  }

  resetForm() {
    this.fullName = '';
    this.age = null;
    this.phone = '';
    this.q1 = '';
    this.q2Ahorcado = false;
    this.q2Preguntados = false;
    this.q2Escape = false;
    this.q2MayorMenor = false;
    this.q3 = '';
  }

  // Método goHome()
  goHome() {
    this.router.navigate(['/home']);  // Redirige a la ruta /home
  }
}