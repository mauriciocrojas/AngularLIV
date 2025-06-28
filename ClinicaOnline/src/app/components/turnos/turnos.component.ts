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

  historia_clinica?: HistoriaClinica;
}

interface HistoriaClinica {
  id?: number;
  fecha_creacion?: string;
  turno_id?: string;
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
  allTurnos: Turno[] = [];
  filtroUniversal: string = '';
  userId = '';
  rol: 'paciente' | 'especialista' | 'administrador' = 'paciente';
  turnoSeleccionado: Turno | null = null;
  modalComentarioTipo: string = '';

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
      this.router.navigate(['/login']);
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
      this.allTurnos = [];
      this.turnos = [];
      console.error(error);
      return;
    }
    if (!data) {
      this.allTurnos = [];
      this.turnos = [];
      return;
    }

    const turnoIds = data.map(t => t.id);
    const pacienteIds = [...new Set(data.map((t) => t.paciente_id))];
    const especialistaIds = [...new Set(data.map((t) => t.especialista_id))];

    let historiasClinicasMap = new Map<string, HistoriaClinica>();
    if (turnoIds.length > 0) {
      const { data: hcData, error: hcError } = await supabase
        .from('historias_clinicas')
        .select('*')
        .in('turno_id', turnoIds);

      if (hcError) {
        console.error('Error cargando historias clínicas', hcError);
      } else if (hcData) {
        hcData.forEach(hc => historiasClinicasMap.set(hc.turno_id, hc));
      }
    }

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

    this.allTurnos = data.map((t) => ({
      ...t,
      resena_especialista: t['resena_especialista'],
      paciente_nombre: mapPacientes.get(t.paciente_id)?.nombre ?? 'Desconocido',
      paciente_apellido: mapPacientes.get(t.paciente_id)?.apellido ?? '',
      especialista_nombre: mapEspecialistas.get(t.especialista_id)?.nombre ?? 'Desconocido',
      especialista_apellido: mapEspecialistas.get(t.especialista_id)?.apellido ?? '',
      historia_clinica: historiasClinicasMap.get(t.id)
    }));

    this.applyFilter();
  }

  applyFilter() {
    if (!this.filtroUniversal) {
      this.turnos = [...this.allTurnos];
      return;
    }

    const searchTerm = this.filtroUniversal.toLowerCase();

    this.turnos = this.allTurnos.filter(t => {
      if (t.especialidad?.toLowerCase().includes(searchTerm)) return true;
      if (t.estado?.toLowerCase().includes(searchTerm)) return true;
      if (t.paciente_nombre?.toLowerCase().includes(searchTerm)) return true;
      if (t.paciente_apellido?.toLowerCase().includes(searchTerm)) return true;
      if (t.especialista_nombre?.toLowerCase().includes(searchTerm)) return true;
      if (t.especialista_apellido?.toLowerCase().includes(searchTerm)) return true;
      if (t.comentario_cancelacion?.toLowerCase().includes(searchTerm)) return true;
      if (t.comentario_rechazo?.toLowerCase().includes(searchTerm)) return true;
      if (t.resena_especialista?.toLowerCase().includes(searchTerm)) return true;
      if (t.comentario_paciente?.toLowerCase().includes(searchTerm)) return true;
      if (t.calificacion_paciente?.toString().includes(searchTerm)) return true;
      if (t.fecha_hora?.toLowerCase().includes(searchTerm)) return true;

      if (t.historia_clinica) {
        const hc = t.historia_clinica;
        if (hc.altura?.toString().includes(searchTerm)) return true;
        if (hc.peso?.toString().includes(searchTerm)) return true;
        if (hc.temperatura?.toString().includes(searchTerm)) return true;
        if (hc.presion?.toLowerCase().includes(searchTerm)) return true;

        if (hc.datos_dinamicos) {
          for (const key in hc.datos_dinamicos) {
            if (key.toLowerCase().includes(searchTerm) || hc.datos_dinamicos[key].toLowerCase().includes(searchTerm)) {
              return true;
            }
          }
        }
      }
      return false;
    });
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
        // El especialista puede finalizar si está aceptado y no tiene historia clínica aún
        return this.rol === 'especialista' && s === 'aceptado' && !t.historia_clinica?.id;
      case 'cargarResenaEspecialista': // Nuevo caso para cargar reseña
        // Solo especialista, turno realizado, y sin reseña previa
        return this.rol === 'especialista' && s === 'realizado' && !t.resena_especialista;
      case 'verResenaEspecialista':
        return !!t.resena_especialista && t.resena_especialista.trim() !== '';
      case 'verComentarioPaciente':
        return !!t.comentario_paciente && t.comentario_paciente.trim() !== '';
      case 'verComentarioCancelacion':
        return !!t.comentario_cancelacion && t.comentario_cancelacion.trim() !== '';
      case 'verComentarioRechazo':
        return !!t.comentario_rechazo && t.comentario_rechazo.trim() !== '';
      case 'calificar':
        return this.rol === 'paciente' && s === 'realizado' && !t.comentario_paciente;
      case 'encuesta':
        return this.rol === 'paciente' && s === 'realizado' && !!t.resena_especialista && !t.comentario_paciente;
      case 'verHistoriaClinica': // Opcional: Para ver historia clínica
        return this.rol === 'especialista' && s === 'realizado' && !!t.historia_clinica?.id;
      default:
        return false;
    }
  }

  async accion(t: Turno, tipo: string) {
    let upd: Partial<Turno> = {};

    if (['verResenaEspecialista', 'verComentarioPaciente', 'verComentarioCancelacion', 'verComentarioRechazo'].includes(tipo)) {
      this.turnoSeleccionado = t;
      this.modalComentarioTipo = tipo;
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

      this.historiaClinica = {
        altura: null,
        peso: null,
        temperatura: null,
        presion: '',
        datos_dinamicos: {},
      };
      this.camposDinamicos = [];

      if (this.historiaForm) {
        this.historiaForm.resetForm();
      }
      return;
    }
    if (tipo === 'cargarResenaEspecialista') { // Nuevo tipo de acción
      const resena = prompt('Ingrese su reseña para este turno:');
      if (!resena) return;
      upd.resena_especialista = resena;
      // No cambiamos el estado del turno aquí, ya está 'realizado'
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

    // Si la acción es 'finalizar', el `update` se hace dentro de `guardarHistoriaClinica`.
    // Para el resto de las acciones, actualizamos el turno aquí.
    if (tipo !== 'finalizar') {
      const { error } = await supabase.from('turnos').update(upd).eq('id', t.id);
      if (error) console.error(error);
    }
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

      // Solo actualizamos el estado del turno a 'realizado'
      const { error: errUpd } = await supabase
        .from('turnos')
        .update({ estado: 'realizado' }) // Eliminamos 'resena_especialista: 'Historia clínica cargada.''
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
    this.modalComentarioTipo = '';
  }

  cerrarModalHistoria() {
    this.modalHistoriaClinicaVisible = false;
    this.turnoParaHistoria = null;
    if (this.historiaForm) {
      this.historiaForm.resetForm();
    }
  }

  getModalTitle(): string {
    switch (this.modalComentarioTipo) {
      case 'verResenaEspecialista':
        return '📝 Reseña del Especialista';
      case 'verComentarioPaciente':
        return '💬 Comentario del Paciente';
      case 'verComentarioCancelacion':
        return '🚫 Motivo de Cancelación';
      case 'verComentarioRechazo':
        return '❌ Motivo de Rechazo';
      default:
        return 'Detalles del Comentario';
    }
  }

  getModalContent(): string {
    if (!this.turnoSeleccionado) {
      return 'No hay contenido disponible.';
    }
    switch (this.modalComentarioTipo) {
      case 'verResenaEspecialista':
        return this.turnoSeleccionado.resena_especialista || 'No hay reseña del especialista.';
      case 'verComentarioPaciente':
        return this.turnoSeleccionado.comentario_paciente || 'No hay comentario del paciente.';
      case 'verComentarioCancelacion':
        return this.turnoSeleccionado.comentario_cancelacion || 'No se especificó un motivo de cancelación.';
      case 'verComentarioRechazo':
        return this.turnoSeleccionado.comentario_rechazo || 'No se especificó un motivo de rechazo.';
      default:
        return 'Contenido no disponible.';
    }
  }
}