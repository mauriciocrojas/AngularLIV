import { Component, OnInit } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  selector: 'app-pacientes',
  templateUrl: './pacientes.component.html',
  styleUrls: ['./pacientes.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class PacientesComponent implements OnInit {
  loading: boolean = false;
  pacientes: any[] = [];
  specialistId: string | null = null;

  selectedPatient: any | null = null;
  selectedPatientTurns: any[] = [];
  selectedTurnoForReview: any | null = null;

  showReviewModal: boolean = false;
  selectedHistoriaClinica: any[] = [];
  selectedPatientName: string = '';

  constructor() {}

  async ngOnInit() {
    this.loading = true;
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('Error al obtener la sesión del usuario:', error);
        this.loading = false;
        return;
      }

      if (user) {
        this.specialistId = user.id;
        await this.loadPatientsForSpecialist();
      } else {
        console.warn('No hay especialista logueado o sesión de usuario no encontrada.');
        this.specialistId = null;
        this.loading = false;
      }
    } catch (e) {
      console.error('Ocurrió un error inesperado durante la verificación de autenticación:', e);
      this.loading = false;
    }
  }

  async loadPatientsForSpecialist() {
    if (!this.specialistId) {
      this.loading = false;
      return;
    }

    this.loading = true;
    try {
      const { data: turnosData, error: turnosError } = await supabase
        .from('turnos')
        .select('paciente_id')
        .eq('especialista_id', this.specialistId)
        .not('paciente_id', 'is', null);

      if (turnosError) {
        console.error('Error al obtener turnos para el especialista:', turnosError);
        this.loading = false;
        return;
      }

      if (!turnosData || turnosData.length === 0) {
        this.pacientes = [];
        this.loading = false;
        return;
      }

      const uniquePatientIds = [...new Set(turnosData.map(turno => turno.paciente_id))];

      const { data: pacientesData, error: pacientesError } = await supabase
        .from('usuarios')
        .select('*')
        .in('id', uniquePatientIds)
        .eq('tipo_usuario', 'paciente');

      if (pacientesError) {
        console.error('Error al obtener pacientes:', pacientesError);
        this.loading = false;
        return;
      }

      this.pacientes = pacientesData;

    } catch (error) {
      console.error('Ocurrió un error inesperado al cargar pacientes:', error);
    } finally {
      this.loading = false;
    }
  }

  async selectPatient(paciente: any) {
    this.loading = true;
    this.selectedPatient = paciente;
    this.selectedPatientTurns = [];
    this.selectedPatientName = `${paciente.nombre} ${paciente.apellido}`;

    try {
      const { data: turns, error } = await supabase
        .from('turnos')
        .select('*')
        .eq('paciente_id', paciente.id)
        .eq('especialista_id', this.specialistId)
        .order('fecha_hora', { ascending: false });

      if (error) {
        console.error('Error al cargar turnos del paciente seleccionado:', error);
        return;
      }
      this.selectedPatientTurns = turns || [];
    } catch (error) {
      console.error('Error inesperado al seleccionar paciente:', error);
    } finally {
      this.loading = false;
    }
  }

  clearSelectedPatient() {
    this.selectedPatient = null;
    this.selectedPatientTurns = [];
    this.selectedTurnoForReview = null;
    this.selectedHistoriaClinica = [];
    this.selectedPatientName = '';
  }

  async viewReview(turno: any) {
    this.loading = true;
    this.selectedTurnoForReview = turno;
    this.selectedHistoriaClinica = [];

    try {
      // Condición mejorada: verificar que resena_especialista existe y no es una cadena vacía
      if (turno.resena_especialista && turno.resena_especialista.trim() !== '') {
        const { data: historiasData, error: historiasError } = await supabase
          .from('historias_clinicas')
          .select('*')
          .eq('turno_id', turno.id);

        if (historiasError) {
          console.error('Error al obtener historias clínicas para la reseña:', historiasError);
          return;
        }
        this.selectedHistoriaClinica = historiasData || [];
      } else {
        // Si no hay reseña, podríamos querer mostrar un mensaje en el modal,
        // aunque el HTML ya lo maneja con 'No hay reseña disponible.'
        console.warn('El turno no tiene una reseña de especialista cargada o está vacía.');
      }
    } catch (error) {
      console.error('Error inesperado al ver reseña:', error);
    } finally {
      this.loading = false;
      this.showReviewModal = true;
    }
  }

  closeReviewModal() {
    this.showReviewModal = false;
    this.selectedTurnoForReview = null;
    this.selectedHistoriaClinica = [];
  }

  getObjectKeys(obj: object): string[] {
    return Object.keys(obj);
  }

  getPatientImageUrl(paciente: any): string {
    if (paciente.imagenes && paciente.imagenes.length > 0) {
      const fileNameInStorage = paciente.imagenes[0];

      const { data } = supabase.storage.from('images').getPublicUrl(fileNameInStorage);

      if (data?.publicUrl) {
        return data.publicUrl;
      }
    }
    return 'assets/default-user.png';
  }
}