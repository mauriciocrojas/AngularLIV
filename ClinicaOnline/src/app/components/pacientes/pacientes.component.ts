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

  showHistoriaClinicaModal: boolean = false;
  selectedHistoriaClinica: any[] = [];
  selectedPatientName: string = '';

  constructor() {
    // El constructor ahora está vacío, ya que la inicialización y la carga se harán en ngOnInit
  }

  async ngOnInit() {
    this.loading = true;
    try {
      // Obtenemos la sesión del usuario actualmente logueado usando Supabase Auth
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('Error getting user session:', error);
        // Podrías redirigir al login si no hay sesión o hay un error grave
        this.loading = false;
        return;
      }

      if (user) {
        this.specialistId = user.id; // El ID del usuario de Supabase
        await this.loadPatientsForSpecialist(); // Cargar pacientes una vez que tenemos el ID del especialista
      } else {
        console.warn('No specialist logged in or user session not found.');
        this.specialistId = null;
        this.loading = false;
      }
    } catch (e) {
      console.error('An unexpected error occurred during auth check:', e);
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
      // 1. Get all turnos attended by this specialist
      const { data: turnosData, error: turnosError } = await supabase
        .from('turnos')
        .select('paciente_id')
        .eq('especialista_id', this.specialistId);

      if (turnosError) {
        console.error('Error fetching turnos for specialist:', turnosError);
        this.loading = false;
        return;
      }

      if (!turnosData || turnosData.length === 0) {
        this.pacientes = [];
        this.loading = false;
        return;
      }

      // Extract unique patient IDs from these turnos
      const uniquePatientIds = [...new Set(turnosData.map(turno => turno.paciente_id))];

      // 2. Fetch patient details for these unique IDs
      const { data: pacientesData, error: pacientesError } = await supabase
        .from('usuarios')
        .select('*')
        .in('id', uniquePatientIds)
        .eq('tipo_usuario', 'paciente'); // Ensure we only get patients

      if (pacientesError) {
        console.error('Error fetching patients:', pacientesError);
        this.loading = false;
        return;
      }

      this.pacientes = pacientesData;

    } catch (error) {
      console.error('An unexpected error occurred while loading patients:', error);
    } finally {
      this.loading = false;
    }
  }

  async verHistoriaClinica(patientId: string, patientName: string) {
    this.loading = true;
    this.selectedHistoriaClinica = [];
    this.selectedPatientName = patientName;

    try {
      // 1. Get turnos for this specific patient and current specialist
      // Asegurarse de que el especialista actual sea quien hizo el turno para ver la historia
      const { data: turnosData, error: turnosError } = await supabase
        .from('turnos')
        .select('id, especialista_id, especialidad, fecha_hora')
        .eq('paciente_id', patientId)
        .eq('especialista_id', this.specialistId); // Filtro crucial para el módulo de especialista

      if (turnosError) {
        console.error('Error fetching turnos for patient history:', turnosError);
        this.loading = false;
        return;
      }

      if (turnosData && turnosData.length > 0) {
        const turnoIds = turnosData.map(turno => turno.id);
        const specialistIdsInTurnos = [...new Set(turnosData.map(turno => turno.especialista_id))];

        // 2. Get clinical histories associated with these filtered turnos
        const { data: historiasData, error: historiasError } = await supabase
          .from('historias_clinicas')
          .select('*')
          .in('turno_id', turnoIds);

        if (historiasError) {
          console.error('Error fetching historias clinicas:', historiasError);
          this.loading = false;
          return;
        }

        // 3. Get specialist names
        let specialistsMap = new Map<string, string>();
        if (specialistIdsInTurnos.length > 0) {
          const { data: specialistsData, error: specialistsError } = await supabase
            .from('usuarios')
            .select('id, nombre, apellido')
            .in('id', specialistIdsInTurnos);

          if (specialistsError) {
            console.error('Error fetching specialists data:', specialistsError);
            this.loading = false;
            return;
          }
          specialistsData.forEach(esp => {
            specialistsMap.set(esp.id, `${esp.nombre} ${esp.apellido}`);
          });
        }

        // 4. Combine histories, turnos, and specialist names
        const combinedHistorias = historiasData.map(historia => {
          const matchingTurno = turnosData.find(turno => turno.id === historia.turno_id);
          const specialistName = matchingTurno?.especialista_id ? specialistsMap.get(matchingTurno.especialista_id) : 'N/A';
          const specialty = matchingTurno?.especialidad || 'N/A';
          const turnoDate = matchingTurno?.fecha_hora || historia.fecha_creacion; // Fallback to creation date if turno date is missing

          return {
            ...historia,
            especialista_nombre: specialistName,
            especialidad: specialty,
            fecha_turno: turnoDate // Use the turno date
          };
        });

        this.selectedHistoriaClinica = combinedHistorias;
      } else {
        this.selectedHistoriaClinica = []; // No histories found for this specialist for this patient
      }
    } catch (error) {
      console.error('An unexpected error occurred:', error);
    } finally {
      this.loading = false;
      this.showHistoriaClinicaModal = true;
    }
  }

  closeHistoriaClinicaModal() {
    this.showHistoriaClinicaModal = false;
    this.selectedHistoriaClinica = [];
    this.selectedPatientName = '';
  }

  getObjectKeys(obj: object): string[] {
    return Object.keys(obj);
  }
}
