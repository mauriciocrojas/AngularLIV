import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { createClient } from '@supabase/supabase-js';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

// Para reCAPTCHA
import { RecaptchaModule, RecaptchaComponent } from 'ng-recaptcha';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule, RecaptchaModule],
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  @ViewChild(RecaptchaComponent) recaptcha!: RecaptchaComponent;

  username: string = '';
  password: string = '';

  tipoUsuario: 'paciente' | 'especialista' | '' = '';
  nombre: string = '';
  apellido: string = '';
  edad: number | null = null;
  dni: string = '';
  obraSocial: string = '';
  especialidadSeleccionada: string = '';
  nuevaEspecialidad: string = '';
  imagenes: File[] = [];

  captchaToken: string | null = null;

  errorMessage: string | null = null;
  successMessage: string | null = null;

  loading: boolean = false;

  especialidades = ['Cardiología', 'Pediatría', 'Traumatología', 'Dermatología'];

  constructor(private router: Router) {}

  onCaptchaResolved(token: string | null) {
    if (token && token.trim() !== '') {
      this.captchaToken = token;
    } else {
      this.captchaToken = null;
    }
  }

  setTipoUsuario(tipo: 'paciente' | 'especialista') {
    this.tipoUsuario = tipo;
  }

  async register() {
    this.errorMessage = null;
    this.successMessage = null;

    if (!this.username || !this.password || !this.tipoUsuario) {
      this.errorMessage = 'Completa todos los campos obligatorios.';
      return;
    }

    if (!this.captchaToken || this.captchaToken.trim() === '') {
      this.errorMessage = 'Por favor, completá el captcha.';
      this.recaptcha.reset();
      return;
    }

    this.loading = true;

    try {
      const { data, error } = await supabase.auth.signUp({
        email: this.username,
        password: this.password,
      });

      if (error) {
        this.errorMessage = this.translateError(error.message);
        this.loading = false;
        this.recaptcha.reset();
        return;
      }

      if (!data.user) {
        this.errorMessage = 'No se pudo crear el usuario.';
        this.loading = false;
        this.recaptcha.reset();
        return;
      }

      const urls = await this.uploadImages();

      if (urls === null) {
        this.errorMessage = 'Error al subir imágenes.';
        this.loading = false;
        this.recaptcha.reset();
        return;
      }

      let especialidadesFinal: string[] = [];

      if (this.tipoUsuario === 'especialista') {
        if (this.especialidadSeleccionada) {
          especialidadesFinal.push(this.especialidadSeleccionada);
        }
        const nueva = this.nuevaEspecialidad.trim();
        if (nueva && !especialidadesFinal.includes(nueva)) {
          especialidadesFinal.push(nueva);
        }
      }

      const dataToInsert: any = {
        id: data.user.id,
        nombre: this.nombre,
        apellido: this.apellido,
        edad: this.edad,
        dni: this.dni,
        email: this.username,
        tipo_usuario: this.tipoUsuario,
        imagenes: urls,
        confirmado: false,
        created_at: new Date().toISOString()
      };

      if (this.tipoUsuario === 'paciente') {
        dataToInsert.obra_social = this.obraSocial;
      } else if (this.tipoUsuario === 'especialista') {
        dataToInsert.especialidad = especialidadesFinal;
      }

      const { error: insertError } = await supabase.from('usuarios').insert([dataToInsert]);

      if (insertError) {
        this.errorMessage = 'Error al guardar los datos del usuario.';
        this.loading = false;
        this.recaptcha.reset();
        return;
      }

      this.successMessage = this.tipoUsuario === 'especialista'
        ? 'Se registró correctamente como especialista. Por favor, confirme su correo electrónico. Posteriormente, un administrador deberá validar su registro para poder acceder al sistema.'
        : 'Se registró correctamente como paciente. Por favor, confirme su correo electrónico para completar el proceso.';

      // Reset campos
      this.username = '';
      this.password = '';
      this.nombre = '';
      this.apellido = '';
      this.edad = null;
      this.dni = '';
      this.obraSocial = '';
      this.especialidadSeleccionada = '';
      this.nuevaEspecialidad = '';
      this.imagenes = [];
      this.captchaToken = null;
      this.recaptcha.reset();

    } catch (error: any) {
      this.errorMessage = error.message || 'Error inesperado.';
      this.recaptcha.reset();
    } finally {
      this.loading = false;
    }
  }

  async uploadImages(): Promise<string[] | null> {
    if (!this.imagenes.length) return [];

    const urls: string[] = [];

    for (const img of this.imagenes) {
      const filePath = `users/${Date.now()}-${img.name}`;
      const { data, error } = await supabase.storage.from('images').upload(filePath, img, { upsert: false });

      if (error) {
        console.error('Error al subir imagen:', error.message);
        return null;
      }
      urls.push(data.path);
    }

    return urls;
  }

  onFilesSelected(event: any) {
    this.imagenes = Array.from(event.target.files);
  }

  translateError(errorMessage: string): string {
    const errorMap: { [key: string]: string } = {
      'Email already registered': 'El correo electrónico ya está registrado.',
      'Invalid email': 'El correo electrónico no es válido.',
      'Password too weak': 'La contraseña es demasiado débil.',
      'Invalid password': 'La contraseña no es válida.',
      'Invalid credentials': 'Credenciales inválidas.',
      'Email not confirmed': 'El correo electrónico no ha sido confirmado.',
    };

    if (
      errorMessage.toLowerCase().includes('user already registered') ||
      errorMessage.toLowerCase().includes('email already registered')
    ) {
      return 'El correo electrónico ya está registrado.';
    }

    return errorMap[errorMessage] || 'Ocurrió un error inesperado. Por favor, intenta de nuevo.';
  }
}
