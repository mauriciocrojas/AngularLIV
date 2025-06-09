import { Component, OnInit } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css'],
  standalone: true,
  imports: [CommonModule,RouterModule, FormsModule],
})
export class UsuariosComponent implements OnInit {
  usuarios: any[] = [];
  nuevoUsuario: any = {
    tipo_usuario: '',
    nombre: '',
    apellido: '',
    edad: null,
    dni: '',
    email: '',
    password: '',
    imagen: null,
    especialidad: '',
    obra_social: ''
  };
  imagenSeleccionada: File | null = null;
  mensaje: string = '';

  async ngOnInit() {
    const { data, error } = await supabase.from('usuarios').select('*');
    if (data) this.usuarios = data;
  }

  async cambiarEstado(usuario: any) {
    const { error } = await supabase
      .from('usuarios')
      .update({ confirmado: !usuario.confirmado })
      .eq('id', usuario.id);

    if (!error) {
      usuario.confirmado = !usuario.confirmado;
      this.mensaje = `Especialista ${usuario.confirmado ? 'habilitado' : 'inhabilitado'}.`;
    }
  }

  onFileSelected(event: any) {
    this.imagenSeleccionada = event.target.files[0];
  }

  async crearUsuario() {
    if (!this.nuevoUsuario.email || !this.nuevoUsuario.password || !this.nuevoUsuario.tipo_usuario) {
      this.mensaje = 'Por favor, completá los campos obligatorios.';
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: this.nuevoUsuario.email,
      password: this.nuevoUsuario.password,
    });

    if (error) {
      this.mensaje = 'Error al registrar el usuario.';
      return;
    }

    let imagePath = '';
    if (this.imagenSeleccionada) {
      const path = `users/${Date.now()}-${this.imagenSeleccionada.name}`;
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('images')
        .upload(path, this.imagenSeleccionada);

      if (uploadError) {
        this.mensaje = 'Error al subir imagen.';
        return;
      }

      imagePath = uploadData?.path;
    }

    const { error: insertError } = await supabase.from('usuarios').insert([{
      id: data.user?.id,
      ...this.nuevoUsuario,
      imagenes: imagePath ? [imagePath] : [],
      confirmado: this.nuevoUsuario.tipo_usuario === 'especialista' ? false : true,
      created_at: new Date().toISOString()
    }]);

    if (!insertError) {
      this.mensaje = 'Usuario creado exitosamente.';
      this.ngOnInit();
      this.nuevoUsuario = {
        tipo_usuario: '',
        nombre: '',
        apellido: '',
        edad: null,
        dni: '',
        email: '',
        password: '',
        imagen: null,
        especialidad: '',
        obra_social: ''
      };
    } else {
      this.mensaje = 'Error al guardar en base de datos.';
    }
  }
}
