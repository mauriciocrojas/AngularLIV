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

  especialistaSeleccionado = '';
  disponibilidadSeleccionada = '';
  filtroEspecialidad = '';

  pacientes: any[] = [];
  pacienteSeleccionado = '';

  error = '';
  success = '';

  constructor(private router: Router, private authService: AuthService) {}

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
    this.limpiarMensajes(); // Limpiar mensajes al iniciar
  }

  async filtrarEspecialistas() {
    this.limpiarMensajes(); // Limpiar mensajes al filtrar especialistas
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
        return Array.isArray(especialidades)
          ? especialidades.includes(this.filtroEspecialidad)
          : false;
      } catch {
        return u.especialidad === this.filtroEspecialidad;
      }
    });

    this.error =
      this.especialistas.length === 0
        ? 'No se encontraron especialistas para la especialidad seleccionada.'
        : '';
  }

  async cargarDisponibilidad() {
    this.limpiarMensajes(); // Limpiar mensajes al cargar disponibilidad
    const hoy = new Date().toISOString().split('T')[0];

    const { data: disponibilidadData, error: disponibilidadError } = await supabase
      .from('disponibilidad_especialista')
      .select('*')
      .eq('especialista_id', this.especialistaSeleccionado)
      .eq('especialidad', this.filtroEspecialidad)
      .gte('fecha', hoy)
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true });

    if (disponibilidadError) {
      this.error = 'Error al cargar disponibilidad: ' + disponibilidadError.message;
      this.disponibilidad = [];
      return;
    }

    const disponibilidades = disponibilidadData || [];

    // Obtener los IDs de las disponibilidades que tienen un turno asociado y NO están 'rechazadas'.
    // Esto significa que 'pendiente', 'aceptado', 'realizado', 'cancelado' (si no se especifica lo contrario)
    // harán que la disponibilidad no aparezca. Solo 'rechazado' la libera.
    const { data: turnosOcupados, error: turnosError } = await supabase
      .from('turnos')
      .select('id_disponibilidad')
      .eq('especialista_id', this.especialistaSeleccionado)
      .eq('especialidad', this.filtroEspecialidad)
      .not('estado', 'eq', 'rechazado') // <--- ¡CAMBIO CLAVE AQUÍ! Solo el estado 'rechazado' la libera
      .not('id_disponibilidad', 'is', null); // Aseguramos que solo traemos turnos con un ID de disponibilidad asociado

    if (turnosError) {
      this.error = 'Error al verificar turnos existentes: ' + turnosError.message;
      this.disponibilidad = [];
      return;
    }

    // Crear un Set con los IDs de las disponibilidades que ya tienen un turno asociado y NO están 'rechazadas'.
    const idsDisponibilidadOcupadas = new Set((turnosOcupados || []).map(t => t.id_disponibilidad));
    
    // Filtrar las disponibilidades: solo mostrar las que NO tienen un ID asociado a un turno ocupado.
    this.disponibilidad = disponibilidades.filter(d => {
      return !idsDisponibilidadOcupadas.has(d.id);
    });

    this.error = this.disponibilidad.length === 0 ? 'No hay turnos disponibles.' : '';
  }

  async solicitar() {
    this.limpiarMensajes(); // Limpiar mensajes al solicitar un turno
    if (!this.disponibilidadSeleccionada) {
      this.error = 'Por favor, selecciona un turno disponible.';
      return;
    }

    const turno = this.disponibilidad.find(d => d.id === this.disponibilidadSeleccionada);
    if (!turno) {
      this.error = 'El turno seleccionado no es válido.';
      return;
    }
    
    // Combina fecha y hora_inicio para crear un timestamp.
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
      estado: 'pendiente', // El estado por defecto al solicitar un turno
      creado_en: new Date().toISOString(),
      id_disponibilidad: turno.id // Guardar el ID de la disponibilidad
    };

    const { error } = await supabase.from('turnos').insert([nuevoTurno]);

    if (error) {
      this.error = error.message;
      this.success = '';
    } else {
      this.success = 'Turno solicitado con éxito.';
      this.resetear(); // Si reseteas el formulario, es bueno que el mensaje persista un momento
                      // Si quieres que se borre inmediatamente, elimina el `this.success = ''` del resetear.
    }
  }

  seleccionarEspecialidad(esp: string) {
    this.limpiarMensajes(); // Limpiar mensajes al seleccionar especialidad
    this.filtroEspecialidad = esp;
    this.filtrarEspecialistas();
  }

  seleccionarEspecialista(e: any) {
    this.limpiarMensajes(); // Limpiar mensajes al seleccionar especialista
    this.especialistaSeleccionado = e.id;
    this.cargarDisponibilidad();
  }

  volverPaso() {
    this.limpiarMensajes(); // Limpiar mensajes al volver un paso
    if (this.disponibilidadSeleccionada) {
      this.disponibilidadSeleccionada = '';
    } else if (this.especialistaSeleccionado) {
      this.especialistaSeleccionado = '';
      this.disponibilidad = [];
    } else if (this.filtroEspecialidad) {
      this.filtroEspecialidad = '';
      this.especialistas = [];
    }
  }

  volverAtras() {
    this.limpiarMensajes(); // Limpiar mensajes al volver a la página anterior
    this.router.navigate(['/']);
  }

  resetear() {
    this.limpiarMensajes(); // Limpiar mensajes al resetear el formulario
    this.filtroEspecialidad = '';
    this.especialistaSeleccionado = '';
    this.disponibilidadSeleccionada = '';
    this.disponibilidad = [];
    this.especialistas = [];
    this.pacienteSeleccionado = '';
    // Los mensajes de éxito/error ya se limpian con this.limpiarMensajes();
  }

  // --- Nueva función para limpiar mensajes ---
  limpiarMensajes() {
    this.error = '';
    this.success = '';
  }
  // --- Fin Nueva función ---

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