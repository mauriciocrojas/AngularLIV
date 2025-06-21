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

  pacientes: any[] = [];
  pacienteSeleccionado = '';

  constructor(private router: Router, private authService: AuthService) { }

  async ngOnInit() {
    this.usuario = await this.authService.getUser();
    if (!this.usuario) return;

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
            try {
              return JSON.parse(u.especialidad);
            } catch {
              return [u.especialidad];
            }
          })
          .filter((e) => !!e)
      )
    );

    if (this.usuario.tipo_usuario === 'administrador') {
      const { data: pacientesData, error: pacientesError } = await supabase
        .from('usuarios')
        .select('id, nombre, apellido')
        .eq('tipo_usuario', 'paciente');

      if (pacientesError) {
        this.error = 'Error al cargar pacientes: ' + pacientesError.message;
        return;
      }

      this.pacientes = pacientesData || [];
    }
  }

  async filtrarEspecialistas() {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, apellido, especialidad, imagenes')
      .eq('tipo_usuario', 'especialista')
      .not('especialidad', 'is', null);

    if (error) {
      this.error = 'Error al buscar especialistas: ' + error.message;
      return;
    }

    this.especialistas = (data || []).filter((u: any) => {
      try {
        const especialidades = JSON.parse(u.especialidad);
        return Array.isArray(especialidades) ? especialidades.includes(this.filtroEspecialidad) : false;
      } catch {
        return u.especialidad === this.filtroEspecialidad;
      }
    });

    this.error = this.especialistas.length === 0 ? 'No se encontraron especialistas para la especialidad seleccionada.' : '';
  }

  async cargarDisponibilidad() {
    const hoy = new Date().toISOString().split('T')[0];

    // 1. Traemos todas las disponibilidades a futuro del especialista para esa especialidad
    const { data: disponibilidadData, error: dispError } = await supabase
      .from('disponibilidad_especialista')
      .select('*')
      .eq('especialista_id', this.especialistaSel)
      .eq('especialidad', this.filtroEspecialidad)
      .gte('fecha', hoy)
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true });

    if (dispError) {
      this.error = 'Error al cargar disponibilidad: ' + dispError.message;
      this.disponibilidad = [];
      return;
    }

    const disponibilidades = disponibilidadData || [];
    const disponibilidadIds = disponibilidades.map(d => d.id);

    // 2. Traemos turnos pendientes o activos asociados a estas disponibilidades
    const { data: turnosOcupados, error: turnosError } = await supabase
      .from('turnos')
      .select('fecha_hora, especialista_id, especialidad')
      .eq('especialista_id', this.especialistaSel)
      .eq('especialidad', this.filtroEspecialidad)
      .in('estado', ['pendiente','aceptado']);

    if (turnosError) {
      this.error = 'Error al verificar turnos ocupados: ' + turnosError.message;
      this.disponibilidad = [];
      return;
    }

    const fechasOcupadas = new Set(
      (turnosOcupados || []).map(t => t.fecha_hora)
    );

    // 3. Filtramos las disponibilidades que NO estén ocupadas
    this.disponibilidad = disponibilidades.filter(d => {
      const fechaHora = `${d.fecha}T${d.hora_inicio}`;
      return !fechasOcupadas.has(fechaHora);
    });

    this.error = this.disponibilidad.length === 0 ? 'No hay turnos disponibles.' : '';
  }

  async solicitar() {
    if (!this.disponibilidadSel) return;

    const turno = this.disponibilidad.find(d => d.id === this.disponibilidadSel);
    const fechaHoraTurno = `${turno.fecha}T${turno.hora_inicio}`;

    const paciente_id = this.usuario.tipo_usuario === 'administrador'
      ? this.pacienteSeleccionado
      : this.usuario.id;

    if (!paciente_id) {
      this.error = 'Seleccioná un paciente para continuar.';
      return;
    }

    const nuevoTurno = {
      paciente_id,
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
      this.resetear();
    }
  }

  seleccionarEspecialidad(esp: string) {
    this.filtroEspecialidad = esp;
    this.filtrarEspecialistas();
  }

  seleccionarEspecialista(e: any) {
    this.especialistaSel = e.id;
    this.cargarDisponibilidad();
  }

  volverPaso() {
    if (this.disponibilidadSel) {
      this.disponibilidadSel = '';
    } else if (this.especialistaSel) {
      this.especialistaSel = '';
      this.disponibilidad = [];
    } else if (this.filtroEspecialidad) {
      this.filtroEspecialidad = '';
      this.especialistas = [];
    }
  }

  volverAtras() {
    this.router.navigate(['/']);
  }

  resetear() {
    this.filtroEspecialidad = '';
    this.especialistaSel = '';
    this.disponibilidadSel = '';
    this.disponibilidad = [];
    this.especialistas = [];
    this.pacienteSeleccionado = '';
    this.error = '';
  }

  imagenesEspecialidades: { [key: string]: string } = {
    'Cardiología': 'assets/especialidades/cardiologia.png',
    'Dermatología': 'assets/especialidades/dermatologia.png',
    'Ginecología': 'assets/especialidades/defecto.png',
    'Pediatría': 'assets/especialidades/defecto.png',
    'Neurología': 'assets/especialidades/neurologia.png',
    'Traumatología': 'assets/especialidades/traumatologia.png',
    'Otorrinolaringología': 'assets/especialidades/defecto.png',
    'Oftalmología': 'assets/especialidades/defecto.png',
    'Odontología': 'assets/especialidades/defecto.png'
  };
}
