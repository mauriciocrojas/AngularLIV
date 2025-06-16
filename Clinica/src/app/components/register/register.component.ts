import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { createClient, User } from '@supabase/supabase-js';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']  // Ojo: cambié a .css como preferís
})
export class RegisterComponent {
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

  errorMessage: string | null = null;
  successMessage: string | null = null;

  loading: boolean = false;  // <--- Spinner activo

  especialidades = ['Cardiología', 'Pediatría', 'Traumatología', 'Dermatología'];

  constructor(private router: Router) { }

  register() {
    this.errorMessage = null;
    this.successMessage = null;

    if (!this.username || !this.password || !this.tipoUsuario) {
      this.errorMessage = 'Completa todos los campos obligatorios.';
      return;
    }

    this.loading = true;  // <--- activo spinner al iniciar registro

    supabase.auth.signUp({
      email: this.username,
      password: this.password,
    }).then(async ({ data, error }) => {
      if (error) {
        console.error('Error en el registro:', error.message);
        this.errorMessage = this.translateError(error.message);
        this.loading = false;  // <--- desactivo spinner si hay error
      } else if (data.user) {
        console.log('Usuario registrado:', data.user);
        await this.saveUserData(data.user);
        this.loading = false;  // <--- desactivo spinner al finalizar
      }
    });
  }

  async saveUserData(user: User) {
    const urls = await this.uploadImages();

    if (urls === null) {
      this.errorMessage = 'Error al subir imágenes.';
      this.loading = false;  // <--- desactivo spinner si falla imagen
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
      id: user.id,
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

    const { error } = await supabase.from('usuarios').insert([dataToInsert]);

    if (error) {
      console.error('Error al guardar en Supabase:', error.message);
      this.errorMessage = 'Error al guardar los datos del usuario.';
    } else {
      this.successMessage = this.tipoUsuario === 'especialista'
        ? 'Se registró correctamente como especialista. Por favor, confirme su correo electrónico. Posteriormente, un administrador deberá validar su registro para poder acceder al sistema.'
        : 'Se registró correctamente como paciente. Por favor, confirme su correo electrónico para completar el proceso.';
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

    if (errorMessage.toLowerCase().includes('user already registered') || errorMessage.toLowerCase().includes('email already registered')) {
      return 'El correo electrónico ya está registrado.';
    }

    return errorMap[errorMessage] || 'Ocurrió un error inesperado. Por favor, intenta de nuevo.';
  }
  
  setTipoUsuario(tipo: 'paciente' | 'especialista') {
    this.tipoUsuario = tipo;
  }


}
