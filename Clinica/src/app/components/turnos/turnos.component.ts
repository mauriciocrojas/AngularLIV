import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
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
  resena_especialista?: string;
  calificacion_paciente?: number;
  comentario_paciente?: string;

  paciente_nombre?: string;
  paciente_apellido?: string;
  especialista_nombre?: string;
  especialista_apellido?: string;

  historia_clinica?: any;
}

interface HistoriaClinica {
  altura: number | null;
  peso: number | null;
  temperatura: number | null;
  presion: string;
  datos_dinamicos?: { [clave: string]: string };
}

@Component({
  selector: 'app-turnos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './turnos.component.html',
  styleUrls: ['./turnos.component.css'],
})
export class TurnosComponent implements OnInit {
  @ViewChild('historiaForm') historiaForm!: NgForm;

  turnos: Turno[] = [];
  filtroEsp = '';
  filtroOtros = '';
  userId = '';
  rol: 'paciente' | 'especialista' | 'administrador' = 'paciente';
  turnoSeleccionado: Turno | null = null;

  // Modal historia clínica
  modalHistoriaClinicaVisible = false;
  historiaClinica: HistoriaClinica = {
    altura: null,
    peso: null,
    temperatura: null,
    presion: '',
    datos_dinamicos: {},
  };
  camposDinamicos: { clave: string; valor: string }[] = [];
  turnoParaHistoria: Turno | null = null;

  constructor(private authService: AuthService, private router: Router) {}

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

    const pacienteIds = [...new Set(data.map((t) => t.paciente_id))];
    const especialistaIds = [...new Set(data.map((t) => t.especialista_id))];

    const { data: pacientes, error: errPac } = await supabase
      .from('usuarios')
      .select('id, nombre, apellido')
      .in('id', pacienteIds);

    if (errPac) {
      console.error('Error cargando pacientes', errPac);
      return;
    }

    const { data: especialistas, error: errEsp } = await supabase
      .from('usuarios')
      .select('id, nombre, apellido')
      .in('id', especialistaIds);

    if (errEsp) {
      console.error('Error cargando especialistas', errEsp);
      return;
    }

    const mapPacientes = new Map(pacientes?.map((p) => [p.id, p]));
    const mapEspecialistas = new Map(especialistas?.map((e) => [e.id, e]));

    this.turnos = data.map((t) => ({
      ...t,
      resena_especialista: t['reseña_especialista'],
      paciente_nombre: mapPacientes.get(t.paciente_id)?.nombre ?? 'Desconocido',
      paciente_apellido: mapPacientes.get(t.paciente_id)?.apellido ?? '',
      especialista_nombre: mapEspecialistas.get(t.especialista_id)?.nombre ?? 'Desconocido',
      especialista_apellido: mapEspecialistas.get(t.especialista_id)?.apellido ?? '',
    }));
  }

  get filtered() {
    return this.turnos.filter(
      (t) =>
        (t.especialidad ?? '').toLowerCase().includes(this.filtroEsp.toLowerCase()) &&
        (this.rol === 'administrador'
          ? ((t.especialista_nombre ?? '') + (t.especialista_apellido ?? '')).toLowerCase().includes(this.filtroOtros.toLowerCase())
          : this.rol === 'paciente'
          ? ((t.especialista_nombre ?? '') + (t.especialista_apellido ?? '')).toLowerCase().includes(this.filtroOtros.toLowerCase())
          : ((t.paciente_nombre ?? '') + (t.paciente_apellido ?? '')).toLowerCase().includes(this.filtroOtros.toLowerCase()))
    );
  }

  isVisible(t: Turno, action: string): boolean {
    const s = t.estado;
    switch (action) {
      case 'cancelar':
        return (['pendiente', 'aceptado'].includes(s) && this.rol !== 'administrador') || (this.rol === 'administrador' && ['pendiente', 'aceptado'].includes(s));
      case 'aceptar':
      case 'rechazar':
        return this.rol === 'especialista' && s === 'pendiente';
      case 'finalizar':
        return this.rol === 'especialista' && s === 'aceptado';
      case 'verResena':
        return !!t.resena_especialista || !!t.comentario_paciente;
      case 'calificar':
        return this.rol === 'paciente' && s === 'realizado' && !t.comentario_paciente;
      case 'encuesta':
        return this.rol === 'paciente' && s === 'realizado' && !!t.resena_especialista && !t.comentario_paciente;
      default:
        return false;
    }
  }

  async accion(t: Turno, tipo: string) {
    let upd: Partial<Turno> = {};

    if (tipo === 'verResena') {
      this.turnoSeleccionado = t;
      return;
    }

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
      this.turnoParaHistoria = t;
      this.modalHistoriaClinicaVisible = true;

      // Resetear la historia clínica y los campos dinámicos cada vez que se abre el modal
      this.historiaClinica = {
        altura: null,
        peso: null,
        temperatura: null,
        presion: '',
        datos_dinamicos: {},
      };
      this.camposDinamicos = [];
      
      // Asegurarse de resetear el estado de validación del formulario
      if (this.historiaForm) {
        this.historiaForm.resetForm();
      }
      return;
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

  async guardarHistoriaClinica() {
    console.log('guardarHistoriaClinica llamada');
    console.log('Estado del formulario:', this.historiaForm.valid);
    console.log('Valores del formulario:', this.historiaClinica);
    console.log('Campos dinámicos:', this.camposDinamicos);

    if (!this.turnoParaHistoria) {
      console.warn('No hay turno seleccionado para guardar historia clínica.');
      return;
    }

    if (this.historiaForm.invalid) {
      alert('Por favor, completa todos los campos obligatorios y corrige los errores de formato.');
      this.historiaForm.form.markAllAsTouched();
      return;
    }

    const datosDinamicosObj: { [clave: string]: string } = {};
    this.camposDinamicos.forEach(({ clave, valor }) => {
      if (clave.trim() && valor.trim()) {
        datosDinamicosObj[clave.trim()] = valor.trim();
      }
    });

    try {
      const { error: errInsert } = await supabase.from('historias_clinicas').insert({
        turno_id: this.turnoParaHistoria.id,
        altura: this.historiaClinica.altura,
        peso: this.historiaClinica.peso,
        temperatura: this.historiaClinica.temperatura,
        presion: this.historiaClinica.presion,
        datos_dinamicos: datosDinamicosObj,
        fecha_creacion: new Date().toISOString(),
      });

      if (errInsert) {
        alert('Error guardando historia clínica.');
        console.error(errInsert);
        return;
      }

      const { error: errUpd } = await supabase
        .from('turnos')
        .update({ estado: 'realizado', reseña_especialista: 'Historia clínica cargada.' })
        .eq('id', this.turnoParaHistoria.id);

      if (errUpd) {
        alert('Error actualizando el estado del turno.');
        console.error(errUpd);
        return;
      }

      alert('Historia clínica guardada correctamente.');

      this.modalHistoriaClinicaVisible = false;
      this.turnoParaHistoria = null;
      await this.load();
    } catch (error) {
      alert('Error inesperado al guardar historia clínica.');
      console.error(error);
    }
  }

  agregarCampoDinamico() {
    if (this.camposDinamicos.length < 3) {
      this.camposDinamicos.push({ clave: '', valor: '' });
    }
  }

  eliminarCampoDinamico(i: number) {
    this.camposDinamicos.splice(i, 1);
  }

  volver() {
    this.router.navigate(['/']);
  }

  cerrarModal() {
    this.turnoSeleccionado = null;
  }

  cerrarModalHistoria() {
    this.modalHistoriaClinicaVisible = false;
    this.turnoParaHistoria = null;
    if (this.historiaForm) {
      this.historiaForm.resetForm();
    }
  }
}