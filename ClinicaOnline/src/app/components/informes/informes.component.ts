import { Component, OnInit } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  selector: 'app-informes',
  templateUrl: './informes.component.html',
  styleUrls: ['./informes.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TitleCasePipe],
})
export class InformesComponent implements OnInit {

  logsIngresos: any[] = [];
  turnosEspecialidad: any[] = [];
  turnosPorDia: any[] = [];
  turnosPorMedico: any[] = [];
  turnosFinalizadosPorMedico: any[] = [];

  fechaInicio: string = '';
  fechaFin: string = '';

  usuarios: any[] = [];

  constructor() { }

  async ngOnInit() {
    await this.cargarUsuarios();
    await this.cargarLogs();
    await this.cargarTurnosPorEspecialidad();
    await this.cargarTurnosPorDia();
  }

  async cargarUsuarios() {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, apellido');
    if (!error && data) {
      this.usuarios = data;
    } else {
      this.usuarios = [];
    }
  }

  async cargarLogs() {
    const { data, error } = await supabase
      .from('login_logs')
      .select('email, login_date');
    if (!error && data) {
      this.logsIngresos = data.map(entry => ({
        email: entry.email,
        fecha: entry.login_date?.split('T')[0],
        hora: entry.login_date?.split('T')[1]?.split('.')[0] ?? ''
      }));
    } else {
      this.logsIngresos = [];
    }
  }

  async cargarTurnosPorEspecialidad() {
    const { data, error } = await supabase
      .from('turnos')
      .select('especialidad');
    if (!error && data) {
      const counts: any = {};
      data.forEach(t => {
        const esp = t.especialidad || 'Sin especialidad';
        counts[esp] = (counts[esp] || 0) + 1;
      });
      this.turnosEspecialidad = Object.entries(counts).map(([especialidad, cantidad]) => ({ especialidad, cantidad }));
    } else {
      this.turnosEspecialidad = [];
    }
  }

  async cargarTurnosPorDia() {
    const { data, error } = await supabase
      .from('turnos')
      .select('fecha_hora');
    if (!error && data) {
      const counts: any = {};
      data.forEach(t => {
        if (t.fecha_hora) {
          const fecha = t.fecha_hora.split('T')[0];
          counts[fecha] = (counts[fecha] || 0) + 1;
        }
      });
      this.turnosPorDia = Object.entries(counts).map(([fecha, cantidad]) => ({ fecha, cantidad }));
    } else {
      this.turnosPorDia = [];
    }
  }

  async cargarTurnosPorMedico() {
    if (!this.fechaInicio || !this.fechaFin) return;

    const { data, error } = await supabase
      .from('turnos')
      .select('especialista_id, estado, fecha_hora')
      .gte('fecha_hora', this.fechaInicio)
      .lte('fecha_hora', this.fechaFin);

    if (!error && data) {
      const solicitados: any = {};
      const finalizados: any = {};

      data.forEach(t => {
        const id = t.especialista_id || 'Desconocido';

        // Contar "solicitado" o "aceptado"
        if (t.estado === 'pendiente' || t.estado === 'aceptado') {
          solicitados[id] = (solicitados[id] || 0) + 1;
        }

        // Contar finalizados
        if (t.estado === 'realizado') {
          finalizados[id] = (finalizados[id] || 0) + 1;
        }
      });

      this.turnosPorMedico = Object.entries(solicitados).map(([id, cantidad]) => {
        const usuario = this.usuarios.find(u => u.id === id);
        const nombreCompleto = usuario ? `${usuario.nombre} ${usuario.apellido}` : id;
        return { especialista: nombreCompleto, cantidad };
      });

      this.turnosFinalizadosPorMedico = Object.entries(finalizados).map(([id, cantidad]) => {
        const usuario = this.usuarios.find(u => u.id === id);
        const nombreCompleto = usuario ? `${usuario.nombre} ${usuario.apellido}` : id;
        return { especialista: nombreCompleto, cantidad };
      });
    } else {
      this.turnosPorMedico = [];
      this.turnosFinalizadosPorMedico = [];
    }
  }


  exportarExcel(data: any[], nombreArchivo: string) {
    if (!data || data.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, `${nombreArchivo}.xlsx`);
  }
}
