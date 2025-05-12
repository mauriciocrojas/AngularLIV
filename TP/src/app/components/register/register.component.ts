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

  // Guardar datos adicionales del usuario en la base de datos
  saveUserData(user: User) {
    console.log('Guardando datos del usuario...');

    // Verifica que el avatar se haya subido
    this.saveFile().then((data) => {
      if (data) {
        console.log('Avatar subido correctamente:', data);
        supabase.from('users-data').insert([{
          authId: user.id,
          name: this.name,
          age: this.age,
          avatarUrl: data.path
        }]).then(({ data, error }) => {
          if (error) {
            console.error('Error al guardar en users-data:', error.message);
          } else {
            console.log('Datos de usuario guardados correctamente en users-data:', data);
            this.router.navigate(['/home']);
          }
        });
      } else {
        console.error('Error al subir el archivo del avatar');
      }
    });
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
  onFileSelected(event: any) {
    this.avatarFile = event.target.files[0];
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
