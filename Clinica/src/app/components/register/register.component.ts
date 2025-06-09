import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { createClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  username: string;
  password: string;
  name: string = '';
  age: number | null = null; // o age = '';
  avatarFile: File | null = null;
  errorMessage: string | null = null;

  tipoUsuario: 'paciente' | 'especialista' | '' = '';
  nombre = '';
  apellido = '';
  edad: number | null = null;
  dni = '';
  obraSocial = '';
  especialidadSeleccionada = '';
  nuevaEspecialidad = '';
  imagenes: File[] = [];

  especialidades = ['Cardiología', 'Pediatría', 'Traumatología', 'Dermatología']; // se puede ir completando


  constructor(private router: Router) {
    this.username = '';
    this.password = '';
  }

  // Registro de usuario
  register() {
    this.errorMessage = null; // Limpiar mensaje anterior
    supabase.auth.signUp({
      email: this.username,
      password: this.password,
    }).then(({ data, error }) => {
      if (error) {
        console.error('Error en el registro:', error.message);
        this.errorMessage = this.translateError(error.message); // Traducir el error al español
      } else {
        console.log('Usuario registrado:', data.user);
        this.saveUserData(data.user!);
      }
    });
  }

  async saveUserData(user: User) {
  const urls = await this.uploadImages();

  if (!urls) {
    this.errorMessage = 'Error al subir imágenes.';
    return;
  }

  const especialidadFinal = this.nuevaEspecialidad.trim() || this.especialidadSeleccionada;

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
    dataToInsert.especialidad = especialidadFinal;
  }

  const { error } = await supabase.from('usuarios').insert([dataToInsert]);

  if (error) {
    console.error('Error al guardar en Supabase:', error.message);
    this.errorMessage = 'Error al guardar los datos del usuario.';
  } else {
    this.router.navigate(['/home']);
  }
}

async uploadImages(): Promise<string[] | null> {
  if (!this.imagenes.length) return null;

  const urls: string[] = [];

  for (const img of this.imagenes) {
    const { data, error } = await supabase.storage
      .from('images')
      .upload(`users/${Date.now()}-${img.name}`, img, { upsert: false });

    if (error) return null;
    urls.push(data.path);
  }

  return urls;
}

  // Función para subir el archivo de avatar
  async saveFile() {
    if (!this.avatarFile) {
      console.error('No se ha seleccionado un archivo de avatar.');
      return null;
    }

    const { data, error } = await supabase
      .storage
      .from('images')
      .upload(`users/${this.avatarFile.name}`, this.avatarFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error al subir el archivo:', error.message);
      return null;
    }

    return data;
  }

  // Manejo de archivo seleccionado
onFilesSelected(event: any) {
  this.imagenes = Array.from(event.target.files);
}

  // Función para traducir los mensajes de error
  translateError(errorMessage: string): string {
    const errorMap: { [key: string]: string } = {
      'Email already registered': 'El correo electrónico ya está registrado.',
      'Invalid email': 'El correo electrónico no es válido.',
      'Password too weak': 'La contraseña es demasiado débil.',
      'Invalid password': 'La contraseña no es válida.',
      'Invalid credentials': 'Credenciales inválidas.',
      'Email not confirmed': 'El correo electrónico no ha sido confirmado.',
      // Otros errores comunes que Supabase podría devolver
    };

    // Detectar errores de "usuario ya registrado" de forma más flexible
    if (errorMessage.toLowerCase().includes('user already registered') || errorMessage.toLowerCase().includes('email already registered')) {
      return 'El correo electrónico ya está registrado.';
    }

    return errorMap[errorMessage] || 'Ocurrió un error inesperado. Por favor, intenta de nuevo.';
  }

}
