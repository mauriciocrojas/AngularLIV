import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';

// *** Importación de html2pdf.js ***
import html2pdf from 'html2pdf.js';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mi-perfil.component.html',
  styleUrls: ['./mi-perfil.component.css']
})
export class MiPerfilComponent implements OnInit {
  usuario: any = {};
  disponibilidad: any[] = [];
  imagenes: string[] = [];
  especialidadesDisponibles: string[] = [];
  nueva = { fecha: '', hi: '', hf: '', especialidad: '' };
  error = '';
  success = '';
  esEspecialista = false;
  esPaciente = false;
  mostrarFormularioDisp = false;
  historiasClinicas: any[] = [];
  historiasClinicasFiltradas: any[] = [];
  especialistasAtendidos: { id: string; nombre: string; apellido: string }[] = [];
  selectedEspecialistaId: string = '';

  // Variable para controlar la visibilidad del contenido a imprimir
  mostrarContenidoPdf = false;

  constructor(private authService: AuthService, private router: Router) {}

  async ngOnInit() {
    try {
      this.usuario = await this.authService.getUser();
      this.esEspecialista = this.usuario?.tipo_usuario === 'especialista';
      this.esPaciente = this.usuario?.tipo_usuario === 'paciente';

      try {
        const parsed = JSON.parse(this.usuario.especialidad);
        this.especialidadesDisponibles = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        this.especialidadesDisponibles = [this.usuario.especialidad];
      }
      this.nueva.especialidad = this.especialidadesDisponibles[0] || '';

      if (Array.isArray(this.usuario.imagenes) && this.usuario.imagenes.length > 0) {
        this.imagenes = this.usuario.imagenes.map((ruta: string) =>
          supabase.storage.from('images').getPublicUrl(ruta).data.publicUrl
        );
      } else if (typeof this.usuario.imagenes === 'string' && this.usuario.imagenes.trim() !== '') {
        try {
          const rutas: string[] = JSON.parse(this.usuario.imagenes);
          if (Array.isArray(rutas)) {
            this.imagenes = rutas.map(ruta =>
              supabase.storage.from('images').getPublicUrl(ruta).data.publicUrl
            );
          }
        } catch {
          this.imagenes = [];
        }
      } else {
        this.imagenes = [];
      }

      if (this.esEspecialista) {
        const { data, error } = await supabase
          .from('disponibilidad_especialista')
          .select('*')
          .eq('especialista_id', this.usuario.id);
        if (!error && data) {
          this.disponibilidad = data;
        }
      }

      if (this.esPaciente) {
        await this.cargarHistoriasClinicas();
      }
    } catch (err) {
      console.error('Error al cargar perfil:', err);
      this.error = 'Error al cargar perfil.';
    }
  }

  async cargarHistoriasClinicas() {
    const { data: turnosPacienteData, error: turnosError } = await supabase
      .from('turnos')
      .select('id, especialista_id, fecha_hora, especialidad')
      .eq('paciente_id', this.usuario.id);

    if (turnosError) {
      console.error('Error al obtener turnos del paciente:', turnosError);
      this.error = 'Error al cargar turnos.';
      return;
    }

    const turnoIds = turnosPacienteData?.map(t => t.id) || [];
    const especialistaIdsUnicos = [...new Set(turnosPacienteData?.map(t => t.especialista_id))];

    if (especialistaIdsUnicos.length > 0) {
      const { data: especialistasData, error: especialistasError } = await supabase
        .from('usuarios')
        .select('id, nombre, apellido')
        .in('id', especialistaIdsUnicos)
        .eq('tipo_usuario', 'especialista');

      if (especialistasError) {
        console.error('Error al obtener especialistas:', especialistasError);
        this.error = 'Error al cargar especialistas.';
        return;
      }
      this.especialistasAtendidos = especialistasData || [];
    } else {
      this.especialistasAtendidos = [];
    }

    const { data: historiasData, error: historiasError } = await supabase
      .from('historias_clinicas')
      .select(`
        id,
        altura,
        peso,
        temperatura,
        presion,
        datos_dinamicos,
        turno_id,
        turnos (
          fecha_hora,
          especialidad,
          especialista_id,
          id
        )
      `)
      .in('turno_id', turnoIds);

    if (historiasError) {
      console.error('Error al obtener historias clínicas:', historiasError);
      this.error = 'Error al cargar historias clínicas.';
      return;
    }

    this.historiasClinicas = (historiasData || []).map((historia: any) => {
      const turnoAsociado = turnosPacienteData?.find(t => t.id === historia.turno_id);
      const especialistaAsociado = this.especialistasAtendidos.find(
        (e: any) => e.id === turnoAsociado?.especialista_id
      );

      return {
        ...historia,
        turnos: {
          ...historia.turnos,
          especialista_nombre: especialistaAsociado ? `${especialistaAsociado.nombre} ${especialistaAsociado.apellido}` : 'Desconocido',
          fecha_hora: turnoAsociado?.fecha_hora,
          especialidad: turnoAsociado?.especialidad
        }
      };
    });

    this.filtrarHistoriasClinicas();
  }

  filtrarHistoriasClinicas() {
    if (this.selectedEspecialistaId) {
      this.historiasClinicasFiltradas = this.historiasClinicas.filter(historia =>
        historia.turnos?.especialista_id === this.selectedEspecialistaId
      );
    } else {
      this.historiasClinicasFiltradas = [...this.historiasClinicas];
    }
  }

  async agregarDisp() {
    this.error = '';
    this.success = '';

    if (!this.nueva.hi || !this.nueva.hf || !this.nueva.fecha) {
      this.error = 'Debe completar la fecha y el horario.';
      return;
    }

    const nuevoRegistro = {
      especialista_id: this.usuario.id,
      especialidad: this.nueva.especialidad,
      fecha: this.nueva.fecha,
      hora_inicio: this.nueva.hi,
      hora_fin: this.nueva.hf,
      creado_en: new Date().toISOString()
    };

    const { error } = await supabase.from('disponibilidad_especialista').insert([nuevoRegistro]);
    if (error) {
      this.error = error.message;
    } else {
      this.success = 'Disponibilidad agregada.';
      this.disponibilidad.push(nuevoRegistro);
      this.nueva = {
        especialidad: this.especialidadesDisponibles[0] || '',
        fecha: '',
        hi: '',
        hf: ''
      };
      this.mostrarFormularioDisp = false;
    }
  }

  async descargarHistoriaClinicaPDF() {
    if (this.historiasClinicasFiltradas.length === 0) {
      alert('No hay historias clínicas para descargar con el filtro actual.');
      return;
    }

    // Paso 1: Mostrar el contenido oculto que se va a convertir
    this.mostrarContenidoPdf = true;

    // Asegúrate de que Angular haya tenido tiempo de renderizar el contenido.
    // Aumentamos el tiempo de espera a 500ms.
    await new Promise(resolve => setTimeout(resolve, 500)); 

    const nombrePaciente = `${this.usuario.nombre} ${this.usuario.apellido}`;
    const filename = `Historia_Clinica_${nombrePaciente}_${this.selectedEspecialistaId ? this.especialistasAtendidos.find(e => e.id === this.selectedEspecialistaId)?.nombre + '_' + this.especialistasAtendidos.find(e => e.id === this.selectedEspecialistaId)?.apellido : 'Todos'}.pdf`;

    const element = document.getElementById('contenido-pdf-generar');

    if (element) {
      const opt = {
        margin:       0.5, // Márgenes en pulgadas
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, logging: true, dpi: 192, letterRendering: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      try {
        await html2pdf().from(element).set(opt).save();
        console.log('PDF generado con éxito');
      } catch (error) {
        console.error('Error al generar el PDF:', error);
        alert('Hubo un error al generar el PDF. Consulta la consola para más detalles.');
      } finally {
        // Paso 3: Ocultar el contenido de nuevo después de la generación
        this.mostrarContenidoPdf = false;
      }
    } else {
      alert('Error: No se encontró el elemento HTML para generar el PDF.');
      this.mostrarContenidoPdf = false;
    }
  }

  volverHome() {
    this.router.navigate(['/']);
  }

  parsearEspecialidad(valor: any): string {
    try {
      const parsed = JSON.parse(valor);
      if (Array.isArray(parsed)) {
        return parsed.join(', ');
      }
      return parsed;
    } catch {
      return valor;
    }
  }

  toggleFormularioDisp() {
    this.mostrarFormularioDisp = !this.mostrarFormularioDisp;
  }
}