import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

interface Turno {
  id: string;
  paciente_id: string;
  especialista_id: string;
  especialidad: string;
  fecha_hora: string;
  estado: string;
  comentario_cancelacion?: string;
  comentario_rechazo?: string;
  reseña_especialista?: string;
  calificacion_paciente?: number;
  comentario_paciente?: string;

  // Nuevos campos para mostrar nombres completos:
  paciente_nombre?: string;
  paciente_apellido?: string;
  especialista_nombre?: string;
  especialista_apellido?: string;
}

@Component({
  selector: 'app-turnos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './turnos.component.html',
  styleUrls: ['./turnos.component.css']
})
export class TurnosComponent implements OnInit {
  turnos: Turno[] = [];
  filtroEsp = '';
  filtroOtros = '';
  userId = '';
  rol: 'paciente' | 'especialista' | 'administrador' = 'paciente';

  constructor(private authService: AuthService, private router: Router) { }

  async ngOnInit() {
    const u = await this.authService.getUser();
    if (!u) {
      console.error('Usuario no autenticado');
      return;
    }
    this.userId = u.id;
    this.rol = u.tipo_usuario;
    await this.load();
  }

  async load() {
    let query = supabase.from('turnos').select('*').order('fecha_hora', { ascending: true });

    if (this.rol === 'paciente') {
      query = query.eq('paciente_id', this.userId);
    } else if (this.rol === 'especialista') {
      query = query.eq('especialista_id', this.userId);
    }

    const { data, error } = await query;
    if (error) {
      this.turnos = [];
      console.error(error);
      return;
    }
    if (!data) {
      this.turnos = [];
      return;
    }

    // Traer todos los ids únicos de pacientes y especialistas para optimizar consultas
    const pacienteIds = [...new Set(data.map(t => t.paciente_id))];
    const especialistaIds = [...new Set(data.map(t => t.especialista_id))];

    // Traer datos de pacientes
    const { data: pacientes, error: errPac } = await supabase
      .from('usuarios')
      .select('id, nombre, apellido')
      .in('id', pacienteIds);

    if (errPac) {
      console.error('Error cargando pacientes', errPac);
      return;
    }

    // Traer datos de especialistas
    const { data: especialistas, error: errEsp } = await supabase
      .from('usuarios')
      .select('id, nombre, apellido')
      .in('id', especialistaIds);

    if (errEsp) {
      console.error('Error cargando especialistas', errEsp);
      return;
    }

    // Mapear para acceso rápido
    const mapPacientes = new Map(pacientes?.map(p => [p.id, p]));
    const mapEspecialistas = new Map(especialistas?.map(e => [e.id, e]));

    // Completar los turnos con nombres
    this.turnos = data.map(t => ({
      ...t,
      paciente_nombre: mapPacientes.get(t.paciente_id)?.nombre ?? 'Desconocido',
      paciente_apellido: mapPacientes.get(t.paciente_id)?.apellido ?? '',
      especialista_nombre: mapEspecialistas.get(t.especialista_id)?.nombre ?? 'Desconocido',
      especialista_apellido: mapEspecialistas.get(t.especialista_id)?.apellido ?? '',
    }));
  }

  get filtered() {
    return this.turnos.filter(t =>
      (t.especialidad ?? '').toLowerCase().includes(this.filtroEsp.toLowerCase()) &&
      (this.rol === 'administrador'
        ? ((t.especialista_nombre ?? '') + (t.especialista_apellido ?? '')).toLowerCase().includes(this.filtroOtros.toLowerCase())
        : (this.rol === 'paciente'
          ? ((t.especialista_nombre ?? '') + (t.especialista_apellido ?? '')).toLowerCase().includes(this.filtroOtros.toLowerCase())
          : ((t.paciente_nombre ?? '') + (t.paciente_apellido ?? '')).toLowerCase().includes(this.filtroOtros.toLowerCase())
        )
      )
    );
  }


  isVisible(t: Turno, action: string): boolean {
    const s = t.estado;
    switch (action) {
      case 'cancelar':
        return (['pendiente', 'aceptado'].includes(s) && this.rol !== 'administrador') ||
          (this.rol === 'administrador' && ['pendiente', 'aceptado'].includes(s));
      case 'aceptar':
      case 'rechazar':
        return this.rol === 'especialista' && s === 'pendiente';
      case 'finalizar':
        return this.rol === 'especialista' && s === 'aceptado';
      case 'verResena':
        return !!t.reseña_especialista || !!t.comentario_paciente;
      case 'calificar':
        return this.rol === 'paciente' && s === 'realizado' && !t.comentario_paciente;
      case 'encuesta':
        return this.rol === 'paciente' && s === 'realizado' && !!t.reseña_especialista && !t.comentario_paciente;
      default:
        return false;
    }
  }

  async accion(t: Turno, tipo: string) {
    let upd: Partial<Turno> = {};
    if (tipo === 'cancelar') {
      const m = prompt('Motivo de cancelación:');
      if (!m) return;
      upd.estado = 'cancelado';
      upd.comentario_cancelacion = m;
    }
    if (tipo === 'aceptar') upd.estado = 'aceptado';
    if (tipo === 'rechazar') {
      const m = prompt('Motivo de rechazo:');
      if (!m) return;
      upd.estado = 'rechazado';
      upd.comentario_rechazo = m;
    }
    if (tipo === 'finalizar') {
      const r = prompt('Reseña / diagnóstico:');
      if (!r) return;
      upd.estado = 'realizado';
      upd.reseña_especialista = r;
    }
    if (tipo === 'calificar' || tipo === 'encuesta') {
      const c = prompt(tipo === 'calificar' ? 'Comentario del paciente:' : 'Comentario adicional:');
      if (!c) return;
      upd.comentario_paciente = c;
      if (tipo === 'calificar') {
        const califStr = prompt('Calificación 1-5:');
        const calif = califStr ? Number(califStr) : undefined;
        if (!calif || calif < 1 || calif > 5) {
          alert('Calificación inválida');
          return;
        }
        upd.calificacion_paciente = calif;
      }
    }

    const { error } = await supabase.from('turnos').update(upd).eq('id', t.id);
    if (error) console.error(error);
    await this.load();
  }

  volver() {
    // Adaptar según tu ruta o historial
    this.router.navigate(['/']); // O a donde quieras volver
  }
}
