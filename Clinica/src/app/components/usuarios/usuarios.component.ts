import { Component, OnInit } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class UsuariosComponent implements OnInit {
    loading: boolean = false; 

  usuarios: any[] = [];
  nuevoUsuario: any = {
    tipo_usuario: '',
    nombre: '',
    apellido: '',
    edad: null,
    dni: '',
    email: '',
    password: '',
    obra_social: '',
    especialidadSeleccionada: '',
    nuevaEspecialidad: ''
  };
  imagenes: File[] = [];
  mensaje: string = '';
  mensaje2: string = '';
  especialidades: string[] = ['Cardiología', 'Pediatría', 'Traumatología', 'Dermatología'];

  async ngOnInit() {
    const { data } = await supabase.from('usuarios').select('*');
    if (data) this.usuarios = data;
  }

  async cambiarEstado(usuario: any) {
    const { error } = await supabase
      .from('usuarios')
      .update({ confirmado: !usuario.confirmado })
      .eq('id', usuario.id);

    if (!error) {
      usuario.confirmado = !usuario.confirmado;
      this.mensaje2 = `Especialista ${usuario.confirmado ? 'habilitado' : 'inhabilitado'}.`;
    }
  }

  onFilesSelected(event: any) {
    this.imagenes = Array.from(event.target.files);
  }

  async crearUsuario() {
  this.mensaje = '';
  this.loading = true; // ⬅️ Mostrar spinner

  const { email, password, tipo_usuario } = this.nuevoUsuario;
  if (!email || !password || !tipo_usuario) {
    this.mensaje = 'Por favor, completá los campos obligatorios.';
    this.loading = false; // ⬅️ Ocultar spinner si hay error
    return;
  }

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    this.mensaje = 'Error al registrar el usuario.';
    this.loading = false; // ⬅️ Ocultar spinner si hay error
    return;
  }

  const urls = await this.uploadImages();
  if (urls === null) {
    this.mensaje = 'Error al subir las imágenes.';
    this.loading = false; // ⬅️ Ocultar spinner si hay error
    return;
  }

  let especialidadesFinal: string[] = [];

  if (tipo_usuario === 'especialista') {
    if (this.nuevoUsuario.especialidadSeleccionada) {
      especialidadesFinal.push(this.nuevoUsuario.especialidadSeleccionada);
    }
    const nueva = this.nuevoUsuario.nuevaEspecialidad.trim();
    if (nueva && !especialidadesFinal.includes(nueva)) {
      especialidadesFinal.push(nueva);
    }
  }

  const usuarioData: any = {
    id: data.user?.id,
    nombre: this.nuevoUsuario.nombre,
    apellido: this.nuevoUsuario.apellido,
    edad: this.nuevoUsuario.edad,
    dni: this.nuevoUsuario.dni,
    email: this.nuevoUsuario.email,
    tipo_usuario: tipo_usuario,
    imagenes: urls,
    confirmado: tipo_usuario === 'especialista' ? false : true,
    created_at: new Date().toISOString()
  };

  if (tipo_usuario === 'paciente') {
    usuarioData.obra_social = this.nuevoUsuario.obra_social;
  } else if (tipo_usuario === 'especialista') {
    usuarioData.especialidad = especialidadesFinal;
  }

  const { error: insertError } = await supabase.from('usuarios').insert([usuarioData]);

  if (insertError) {
    this.mensaje = 'Error al guardar en base de datos.';
  } else {
    this.mensaje = 'Usuario creado exitosamente.';
    await this.ngOnInit();
    this.resetFormulario();
  }

  this.loading = false; // ⬅️ Ocultar spinner al finalizar
}

  async uploadImages(): Promise<string[] | null> {
    const urls: string[] = [];

    for (const img of this.imagenes) {
      const filePath = `users/${Date.now()}-${img.name}`;
      const { data, error } = await supabase.storage.from('images').upload(filePath, img);
      if (error) return null;
      urls.push(data.path);
    }

    return urls;
  }

  resetFormulario() {
    this.nuevoUsuario = {
      tipo_usuario: '',
      nombre: '',
      apellido: '',
      edad: null,
      dni: '',
      email: '',
      password: '',
      obra_social: '',
      especialidadSeleccionada: '',
      nuevaEspecialidad: ''
    };
    this.imagenes = [];
  }
}
