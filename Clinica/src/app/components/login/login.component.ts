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
  errorMessage: string = "";

  constructor(private router: Router) {}

  async login() {
  this.errorMessage = '';

  // Validaciones básicas
  if (!this.email || !this.password) {
    this.errorMessage = 'Por favor, complete todos los campos.';
    return;
  }

  if (!this.validateEmail(this.email)) {
    this.errorMessage = 'Ingrese un correo electrónico válido.';
    return;
  }

  // Intentar iniciar sesión
  const { data, error } = await supabase.auth.signInWithPassword({
    email: this.email,
    password: this.password,
  });

  if (error) {
    // Analizar mensaje de error
    if (error.message.includes('Email not confirmed')) {
      this.errorMessage = 'Debe verificar su correo electrónico antes de ingresar. Revise su bandeja de entrada.';
    } else if (error.message.includes('Invalid login credentials')) {
      this.errorMessage = 'Correo electrónico o contraseña incorrectos.';
    } else {
      this.errorMessage = 'Error al iniciar sesión. Intente nuevamente más tarde.';
    }
    console.error('Error:', error.message);
    return;
  }

  const user = data.user;

  // Verificación de email (seguridad adicional por si pasa el control anterior)
  if (!user?.email_confirmed_at) {
    this.errorMessage = 'Debe verificar su correo electrónico antes de ingresar. Revise su bandeja de entrada.';
    return;
  }

  // Obtener datos adicionales del usuario desde la tabla `usuarios`
  const { data: userData, error: userError } = await supabase
    .from('usuarios')
    .select('tipo_usuario, confirmado')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    this.errorMessage = 'Error obteniendo los datos del usuario.';
    console.error('Error obteniendo usuario:', userError?.message);
    return;
  }

  const { tipo_usuario, confirmado } = userData;

  // Validar aprobación del administrador para especialistas
  if (tipo_usuario === 'especialista' && !confirmado) {
    this.errorMessage = 'Un administrador debe aprobar su cuenta antes de ingresar.';
    return;
  }

  // Registrar el acceso
  await supabase.from('login_logs').insert({
    email: this.email,
    login_date: new Date().toISOString(),
  });

  // Redireccionar al home
  this.router.navigate(['/home']);
}


  preloadData() {
    this.email = 'mauriciocc.rojas@gmail.com';
    this.password = '123456';
  }

  validateEmail(email: string) {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  }
}
