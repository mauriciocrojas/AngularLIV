import { Component, OnInit } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

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

  // Variables para el modal de historia clínica
  showHistoriaClinicaModal: boolean = false;
  selectedHistoriaClinica: any[] = [];
  selectedPatientName: string = '';

  async ngOnInit() {
    this.loading = true;
    const { data, error } = await supabase.from('usuarios').select('*');
    if (error) {
      console.error('Error fetching users:', error);
      this.mensaje2 = 'Error al cargar los usuarios.';
    } else if (data) {
      this.usuarios = data;
    }
    this.loading = false;
  }

  async cambiarEstado(usuario: any) {
    this.loading = true;
    const { error } = await supabase
      .from('usuarios')
      .update({ confirmado: !usuario.confirmado })
      .eq('id', usuario.id);

    if (!error) {
      usuario.confirmado = !usuario.confirmado;
      this.mensaje2 = `Especialista ${usuario.confirmado ? 'habilitado' : 'inhabilitado'}.`;
    } else {
      console.error('Error changing user status:', error);
      this.mensaje2 = 'Error al cambiar el estado del especialista.';
    }
    this.loading = false;
  }

  onFilesSelected(event: any) {
    this.imagenes = Array.from(event.target.files);
  }

  async crearUsuario() {
    this.mensaje = '';
    this.loading = true;

    const { email, password, tipo_usuario } = this.nuevoUsuario;
    if (!email || !password || !tipo_usuario) {
      this.mensaje = 'Por favor, completá los campos obligatorios.';
      this.loading = false;
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) {
      this.mensaje = 'Error al registrar el usuario: ' + authError.message;
      this.loading = false;
      return;
    }

    const urls = await this.uploadImages();
    if (urls === null) {
      this.mensaje = 'Error al subir las imágenes.';
      this.loading = false;
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
      id: authData.user?.id,
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
      this.mensaje = 'Error al guardar en base de datos: ' + insertError.message;
    } else {
      this.mensaje = 'Usuario creado exitosamente.';
      await this.ngOnInit(); // Refresh user list
      this.resetFormulario();
    }

    this.loading = false;
  }

  async uploadImages(): Promise<string[] | null> {
    const urls: string[] = [];

    for (const img of this.imagenes) {
      const filePath = `users/${Date.now()}-${img.name}`;
      const { data, error } = await supabase.storage.from('images').upload(filePath, img);
      if (error) {
        console.error('Error uploading image:', error);
        return null;
      }
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

  exportarUsuariosExcel() {
    const exportData = this.usuarios.map(u => ({
      Tipo: u.tipo_usuario,
      Nombre: `${u.nombre} ${u.apellido}`,
      Email: u.email,
      Edad: u.edad,
      DNI: u.dni,
      Confirmado: u.confirmado ? 'Sí' : 'No'
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Usuarios': worksheet },
      SheetNames: ['Usuarios']
    };

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, 'usuarios-clinica.xlsx');
  }

  // --- Funciones para Historia Clínica ---

  async verHistoriaClinica(patientId: string, patientName: string) {
    this.loading = true;
    this.selectedHistoriaClinica = [];
    this.selectedPatientName = patientName;

    try {
      // 1. Obtener los turnos del paciente, incluyendo especialista_id, especialidad y fecha_hora
      const { data: turnosData, error: turnosError } = await supabase
        .from('turnos')
        .select('id, especialista_id, especialidad, fecha_hora') // Incluido fecha_hora
        .eq('paciente_id', patientId);

      if (turnosError) {
        console.error('Error fetching turnos for patient:', turnosError);
        this.mensaje2 = 'Error al cargar los turnos del paciente.';
        this.loading = false;
        return;
      }

      if (turnosData && turnosData.length > 0) {
        const turnoIds = turnosData.map(turno => turno.id);
        const especialistaIds = [...new Set(turnosData.map(turno => turno.especialista_id))];

        // 2. Obtener las historias clínicas asociadas a esos turnos
        const { data: historiasData, error: historiasError } = await supabase
          .from('historias_clinicas')
          .select('*')
          .in('turno_id', turnoIds);

        if (historiasError) {
          console.error('Error fetching historias clinicas:', historiasError);
          this.mensaje2 = 'Error al cargar las historias clínicas.';
          this.loading = false;
          return;
        }

        // 3. Obtener los nombres de los especialistas
        let especialistasMap = new Map<string, string>();
        if (especialistaIds.length > 0) {
          const { data: especialistasData, error: especialistasError } = await supabase
            .from('usuarios')
            .select('id, nombre, apellido')
            .in('id', especialistaIds);

          if (especialistasError) {
            console.error('Error fetching specialists:', especialistasError);
            this.mensaje2 = 'Error al cargar los datos de los especialistas.';
            this.loading = false;
            return;
          }

          especialistasData.forEach(esp => {
            especialistasMap.set(esp.id, `${esp.nombre} ${esp.apellido}`);
          });
        }

        // 4. Combinar historias, turnos y nombres de especialistas
        const combinedHistorias = historiasData.map(historia => {
          const turnoCorrespondiente = turnosData.find(turno => turno.id === historia.turno_id);
          const especialistaNombre = turnoCorrespondiente?.especialista_id ? especialistasMap.get(turnoCorrespondiente.especialista_id) : 'N/A';
          const especialidad = turnoCorrespondiente?.especialidad || 'N/A';
          const fechaTurno = turnoCorrespondiente?.fecha_hora || historia.fecha_creacion; // Usar fecha_hora del turno, sino fecha_creacion de la historia

          return {
            ...historia,
            especialista_nombre: especialistaNombre,
            especialidad: especialidad,
            fecha_turno: fechaTurno // Añadir la fecha del turno
          };
        });

        this.selectedHistoriaClinica = combinedHistorias;
      }
    } catch (error) {
      console.error('An unexpected error occurred:', error);
      this.mensaje2 = 'Ocurrió un error inesperado al cargar la historia clínica.';
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

  // Helper para obtener las keys de un objeto (para datos dinámicos)
  getObjectKeys(obj: object): string[] {
    return Object.keys(obj);
  }
}
