import { Component, OnInit, AfterViewInit } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Chart from 'chart.js/auto';
import html2pdf from 'html2pdf.js';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  selector: 'app-informes',
  templateUrl: './informes.component.html',
  styleUrls: ['./informes.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TitleCasePipe],
})
export class InformesComponent implements OnInit, AfterViewInit {

  logsIngresos: any[] = [];
  turnosEspecialidad: any[] = [];
  turnosPorDia: any[] = [];
  turnosPorMedico: any[] = [];
  turnosFinalizadosPorMedico: any[] = [];
  usuarios: any[] = [];

  fechaInicio: string = '';
  fechaFin: string = '';

  // Charts
  chartEspecialidad: any;
  chartDia: any;
  chartMedico: any;

  constructor() { }

  async ngOnInit() {
    await this.cargarUsuarios();
    await this.cargarLogs();
    await this.cargarTurnosPorEspecialidad();
    await this.cargarTurnosPorDia();
    this.dibujarChartEspecialidad();
    this.dibujarChartDia();
  }

  ngAfterViewInit() {
    // Inicializa gráficos vacíos si hace falta
  }

  async cargarUsuarios() {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, apellido');
    this.usuarios = !error && data ? data : [];
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
      .select('especialidad, estado')
      .not('estado', 'in', '("rechazado","cancelado")');

    if (!error && data) {
      const counts: any = {};
      data.forEach(t => {
        const esp = t.especialidad || 'Sin especialidad';
        counts[esp] = (counts[esp] || 0) + 1;
      });
      this.turnosEspecialidad = Object.entries(counts).map(([especialidad, cantidad]) => ({ especialidad, cantidad }));
      this.dibujarChartEspecialidad();
    } else {
      this.turnosEspecialidad = [];
    }
  }


  async cargarTurnosPorDia() {
    const { data, error } = await supabase
      .from('turnos')
      .select('fecha_hora, estado')
      .not('estado', 'in', '("rechazado","cancelado")');

    if (!error && data) {
      const counts: any = {};
      data.forEach(t => {
        if (t.fecha_hora) {
          const fecha = t.fecha_hora.split('T')[0];
          counts[fecha] = (counts[fecha] || 0) + 1;
        }
      });
      this.turnosPorDia = Object.entries(counts)
        .map(([fecha, cantidad]) => ({ fecha, cantidad }))
        .sort((a, b) => a.fecha.localeCompare(b.fecha));
      this.dibujarChartDia();
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
        if (t.estado === 'pendiente' || t.estado === 'aceptado') {
          solicitados[id] = (solicitados[id] || 0) + 1;
        }
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

  // ========== Gráficos ==========
  dibujarChartEspecialidad() {
    if (this.chartEspecialidad) this.chartEspecialidad.destroy();
    const labels = this.turnosEspecialidad.map(t => t.especialidad);
    const data = this.turnosEspecialidad.map(t => t.cantidad);

    const ctx = document.getElementById('chartEspecialidad') as HTMLCanvasElement;
    if (!ctx) return;

    this.chartEspecialidad = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Turnos',
          data,
          backgroundColor: '#52b788'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  dibujarChartDia() {
    if (this.chartDia) this.chartDia.destroy();
    const labels = this.turnosPorDia.map(t => this.formatFecha(t.fecha));
    const data = this.turnosPorDia.map(t => t.cantidad);

    const ctx = document.getElementById('chartDia') as HTMLCanvasElement;
    if (!ctx) return;

    this.chartDia = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Turnos por día',
          data,
          backgroundColor: '#40916c',
          borderColor: '#40916c',
          fill: false,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true }
        }
      }
    });
  }

  dibujarChartMedico() {
    if (this.chartMedico) this.chartMedico.destroy();
    const labels = this.turnosPorMedico.map(t => t.especialista);
    const data = this.turnosPorMedico.map(t => t.cantidad);

    const ctx = document.getElementById('chartMedico') as HTMLCanvasElement;
    if (!ctx) return;

    this.chartMedico = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Solicitados',
          data,
          backgroundColor: '#2d6a4f'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  // ========== Exportación ==========
  exportarExcel(data: any[], nombreArchivo: string) {
    if (!data || data.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    const dataFormateada = data.map(item => {
      const nuevoItem: any = {};
      for (const key in item) {
        if (item.hasOwnProperty(key)) {
          const valor = item[key];
          if (typeof valor === 'string' && this.esFechaISO(valor)) {
            nuevoItem[key] = this.formatFechaISO(valor);
          } else {
            nuevoItem[key] = valor;
          }
        }
      }
      return nuevoItem;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataFormateada);
    const workbook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, `${nombreArchivo}.xlsx`);
  }

  esFechaISO(valor: string): boolean {
    return /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(valor);
  }

  formatFechaISO(fechaISO: string): string {
    const fecha = fechaISO.split('T')[0];
    const partes = fecha.split('-');
    if (partes.length !== 3) return fechaISO;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  formatFecha(fechaISO: string | undefined): string {
    if (!fechaISO) return '';
    const partes = fechaISO.split('-');
    if (partes.length !== 3) return fechaISO;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  generarPDF() {
    const elemento = document.getElementById('contenedor-reportes');
    if (!elemento) {
      alert('No se encontró el contenedor para exportar.');
      return;
    }

    const opciones = {
      margin: 0.5,
      filename: 'reporte_turnos.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 }, // Alta resolución
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] } // 🔥 Esto divide en varias páginas si es largo
    };

    html2pdf().from(elemento).set(opciones).save();
  }

  volver() {
    window.history.back();
  }

}
