import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';


const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  selector: 'app-solicitar-turnos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitar-turno.component.html',
  styleUrls: ['./solicitar-turno.component.css']
})
export class SolicitarTurnosComponent implements OnInit {
  usuario: any = {};
  especialidades: string[] = [];
  especialistas: any[] = [];
  disponibilidad: any[] = [];
  especialistaSel = '';
  disponibilidadSel = '';
  error = '';
  success = '';
  filtroEspecialidad = '';

  dias: string[] = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  meses = [
    { nombre: 'Enero', valor: '01' },
    { nombre: 'Febrero', valor: '02' },
    { nombre: 'Marzo', valor: '03' },
    { nombre: 'Abril', valor: '04' },
    { nombre: 'Mayo', valor: '05' },
    { nombre: 'Junio', valor: '06' },
    { nombre: 'Julio', valor: '07' },
    { nombre: 'Agosto', valor: '08' },
    { nombre: 'Septiembre', valor: '09' },
    { nombre: 'Octubre', valor: '10' },
    { nombre: 'Noviembre', valor: '11' },
    { nombre: 'Diciembre', valor: '12' },
  ];
  anios: string[] = [];

  dia = '';
  mes = '';
  anio = '';

  constructor(private router: Router, private authService: AuthService) {}

  async ngOnInit() {
    this.usuario = await this.authService.getUser();
    if (!this.usuario) return;

    const anioActual = new Date().getFullYear();
    this.anios = [anioActual, anioActual + 1].map(a => a.toString());

    // Cargar especialidades únicas de especialistas
    const { data, error } = await supabase
      .from('usuarios')
      .select('especialidad')
      .eq('tipo_usuario', 'especialista');

    if (error) {
      this.error = 'Error al cargar especialidades: ' + error.message;
      return;
    }

    this.especialidades = Array.from(
      new Set(
        (data || [])
          .flatMap((u: any) => {
            if (!u.especialidad) return [];
            if (typeof u.especialidad === 'string' && u.especialidad.startsWith('[')) {
              try {
                return JSON.parse(u.especialidad);
              } catch {
                return [u.especialidad];
              }
            }
            if (Array.isArray(u.especialidad)) return u.especialidad;
            return [u.especialidad];
          })
          .filter((e) => !!e)
      )
    );
  }

  async filtrarEspecialistas() {
  if (!this.filtroEspecialidad) {
    this.error = 'Por favor, selecciona una especialidad.';
    this.especialistas = [];
    this.disponibilidad = [];
    return;
  }
  this.error = '';

  // Traemos todos los especialistas que tengan especialidad no nula
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre, apellido, especialidad')
    .eq('tipo_usuario', 'especialista')
    .not('especialidad', 'is', null);

  if (error) {
    this.error = 'Error al buscar especialistas: ' + error.message;
    this.especialistas = [];
    this.disponibilidad = [];
    return;
  }

  if (!data || data.length === 0) {
    this.error = 'No se encontraron especialistas.';
    this.especialistas = [];
    this.disponibilidad = [];
    return;
  }

  // Filtrar especialistas cuyo campo especialidad (JSON string) contenga la especialidad seleccionada
  this.especialistas = data.filter((u: any) => {
    if (!u.especialidad) return false;

    let especArray: string[] = [];

    try {
      especArray = JSON.parse(u.especialidad);
      if (!Array.isArray(especArray)) {
        especArray = [u.especialidad];
      }
    } catch {
      especArray = [u.especialidad];
    }

    return especArray.includes(this.filtroEspecialidad);
  });

  if (this.especialistas.length === 0) {
    this.error = 'No se encontraron especialistas para la especialidad seleccionada.';
    this.disponibilidad = [];
  } else {
    this.error = '';
  }

  this.especialistaSel = '';
  this.disponibilidad = [];
  this.disponibilidadSel = '';

  // Limpiar selección de fecha
  this.dia = '';
  this.mes = '';
  this.anio = '';
}


  async cargarDisponibilidad() {
    if (!this.especialistaSel || !this.filtroEspecialidad || !this.dia || !this.mes || !this.anio) {
      this.disponibilidad = [];
      this.disponibilidadSel = '';
      return;
    }

    const fechaSeleccionada = `${this.anio}-${this.mes}-${this.dia}`;

    const { data, error } = await supabase
      .from('disponibilidad_especialista')
      .select('*')
      .eq('especialista_id', this.especialistaSel)
      .eq('especialidad', this.filtroEspecialidad) // es string aquí, no array
      .eq('fecha', fechaSeleccionada)
      .order('hora_inicio', { ascending: true });

    if (error) {
      this.error = 'Error al cargar disponibilidad: ' + error.message;
      this.disponibilidad = [];
      this.disponibilidadSel = '';
      return;
    }

    if (!data || data.length === 0) {
      this.error = 'No hay turnos disponibles para este especialista en la fecha seleccionada.';
      this.disponibilidad = [];
      this.disponibilidadSel = '';
      return;
    }

    this.disponibilidad = data;
    this.disponibilidadSel = '';
    this.error = '';
  }

  async solicitar() {
  if (!this.disponibilidadSel) {
    this.error = 'Por favor, selecciona un turno disponible.';
    this.success = '';
    return;
  }

  const turno = this.disponibilidad.find(d => d.id === this.disponibilidadSel);
  if (!turno) {
    this.error = 'Turno seleccionado inválido.';
    this.success = '';
    return;
  }

  // Armar fecha + hora correcto sin agregar :00 extra
  const fechaHoraTurno = `${turno.fecha}T${turno.hora_inicio}`;

  const nuevoTurno = {
    paciente_id: this.usuario.id,
    especialista_id: turno.especialista_id,
    especialidad: turno.especialidad,
    fecha_hora: fechaHoraTurno,
    estado: 'pendiente',
    creado_en: new Date().toISOString()
  };

  const { error } = await supabase.from('turnos').insert([nuevoTurno]);
  if (error) {
    this.error = error.message;
    this.success = '';
  } else {
    this.success = 'Turno solicitado con éxito.';
    this.error = '';

    // Resetear todo para nuevo pedido
    this.filtroEspecialidad = '';
    this.especialistas = [];
    this.especialistaSel = '';
    this.disponibilidad = [];
    this.disponibilidadSel = '';
    this.dia = '';
    this.mes = '';
    this.anio = '';
  }
}


  limpiarDisponibilidad() {
    this.disponibilidad = [];
    this.disponibilidadSel = '';
  }

  volverAtras() {
    this.router.navigate(['/']);
  }
}
