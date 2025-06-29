import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, TitleCasePipe, DatePipe } from '@angular/common'; // Agregamos DatePipe
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { BaseChartDirective } from 'ng2-charts'; // Importar BaseChartDirective
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Directivas Personalizadas ---
import { TipoUsuarioHighlightDirective } from '../../directives/tipo-usuario-highlight.directive'; // Directiva 1
import { BordeResaltadoDirective } from '../../directives/borde-resaltado.directive'; // Directiva 2
import { TooltipDirective } from '../../directives/tooltip.directive'; // Directiva 3

// --- Pipes Personalizados ---
import { DuracionTurnoPipe } from '../../pipes/duracion-turno.pipe'; // Pipe 1
import { EstadoTurnoPipe } from '../../pipes/estado-turno.pipe'; // Pipe 2
import { FiltroPorFechaPipe } from '../../pipes/filtro-por-fecha.pipe'; // Pipe 3

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  selector: 'app-informes',
  templateUrl: './informes.component.html',
  styleUrls: ['./informes.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TitleCasePipe,
    DatePipe, // Necesario para los pipes de fecha en el HTML
    BaseChartDirective, // Importar para usar <canvas baseChart>
    // Directivas
    TipoUsuarioHighlightDirective,
    BordeResaltadoDirective,
    TooltipDirective,
    // Pipes
    DuracionTurnoPipe,
    EstadoTurnoPipe,
    FiltroPorFechaPipe
  ],
  providers: [DatePipe] // Proveer DatePipe si no está disponible globalmente
})
export class InformesComponent implements OnInit {

  @ViewChild('logIngresosSection') logIngresosSection!: ElementRef;
  @ViewChild('turnosEspecialidadSection') turnosEspecialidadSection!: ElementRef;
  @ViewChild('turnosPorDiaSection') turnosPorDiaSection!: ElementRef;
  @ViewChild('turnosSolicitadosMedicoSection') turnosSolicitadosMedicoSection!: ElementRef;
  @ViewChild('turnosFinalizadosMedicoSection') turnosFinalizadosMedicoSection!: ElementRef;

  // Fechas para filtros globales
  fechaDesde: string = '';
  fechaHasta: string = '';

  // Data para Log de Ingresos
  logIngresos: any[] = [];

  // Data para Cantidad de Turnos por Especialidad (Gráfico de Torta)
  public turnosPorEspecialidadLabels: string[] = [];
  public turnosPorEspecialidadData: ChartConfiguration<'pie'>['data']['datasets'] = [{ data: [], label: 'Turnos' }];

  // Data para Cantidad de Turnos por Día (Gráfico de Barras)
  public turnosPorDiaLabels: string[] = [];
  public turnosPorDiaData: ChartConfiguration<'bar'>['data']['datasets'] = [{ data: [], label: 'Turnos', backgroundColor: '#4CAF50' }];

  // Data para Cantidad de Turnos Solicitados por Médico (Gráfico de Dona)
  medicos: any[] = [];
  medicoSeleccionado: string = '';
  selectedMedicoName: string = '';
  public turnosSolicitadosMedicoLabels: string[] = [];
  public turnosSolicitadosMedicoData: ChartConfiguration<'doughnut'>['data']['datasets'] = [{ data: [], label: 'Estado del Turno' }];

  // Data para Cantidad de Turnos Finalizados por Médico (Gráfico de Barras)
  public turnosFinalizadosMedicoLabels: string[] = [];
  public turnosFinalizadosMedicoData: ChartConfiguration<'bar'>['data']['datasets'] = [{ data: [], label: 'Duración (min)', backgroundColor: '#2196F3' }];

  // Opciones comunes para los gráficos
  public chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw as number;
            const total = context.dataset.data.reduce((sum, val) => (sum as number) + (val as number), 0) as number;
            const percentage = ((value / total) * 100).toFixed(2);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  constructor(private datePipe: DatePipe) { // Inyectar DatePipe
    // Inicializar fechas al último mes por defecto
    const today = new Date();
    this.fechaHasta = today.toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
    this.fechaDesde = thirtyDaysAgo.toISOString().split('T')[0];
  }

  async ngOnInit() {
    await this.loadMedicos();
    await this.cargarTodosLosInformes();
  }

  async cargarTodosLosInformes() {
    await this.loadLogIngresos();
    await this.loadTurnosPorEspecialidad();
    await this.loadTurnosPorDia();
    if (this.medicoSeleccionado) {
      await this.cargarInformesMedico();
    }
  }

  // --- LOG DE INGRESOS ---
  async loadLogIngresos() {
    let query = supabase.from('logs_ingresos').select(`
      fecha_ingreso,
      usuario_id,
      usuarios (
        nombre,
        apellido,
        email,
        tipo_usuario
      )
    `).order('fecha_ingreso', { ascending: false });

    if (this.fechaDesde) {
      query = query.gte('fecha_ingreso', this.fechaDesde + 'T00:00:00Z');
    }
    if (this.fechaHasta) {
      query = query.lte('fecha_ingreso', this.fechaHasta + 'T23:59:59Z');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al cargar log de ingresos:', error);
      this.logIngresos = [];
      return;
    }

    this.logIngresos = data.map((item: any) => ({
      fecha_ingreso: item.fecha_ingreso,
      nombre_usuario: item.usuarios.nombre,
      apellido_usuario: item.usuarios.apellido,
      email_usuario: item.usuarios.email,
      tipo_usuario: item.usuarios.tipo_usuario
    }));
  }

  downloadLogIngresos(type: 'excel' | 'pdf') {
    const dataToExport = this.logIngresos.map(log => ({
      'Usuario': `${log.nombre_usuario} ${log.apellido_usuario}`,
      'Tipo de Usuario': log.tipo_usuario,
      'Email': log.email_usuario,
      'Día': this.datePipe.transform(log.fecha_ingreso, 'dd/MM/yyyy'),
      'Hora': this.datePipe.transform(log.fecha_ingreso, 'HH:mm')
    }));

    if (type === 'excel') {
      this.exportToExcel(dataToExport, 'log_ingresos');
    } else {
      this.exportHtmlToPdf(this.logIngresosSection.nativeElement, 'log_ingresos.pdf');
    }
  }

  // --- CANTIDAD DE TURNOS POR ESPECIALIDAD ---
  async loadTurnosPorEspecialidad() {
    let query = supabase.from('turnos').select('especialidad');

    if (this.fechaDesde) {
      query = query.gte('fecha_hora', this.fechaDesde + 'T00:00:00Z');
    }
    if (this.fechaHasta) {
      query = query.lte('fecha_hora', this.fechaHasta + 'T23:59:59Z');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al cargar turnos por especialidad:', error);
      this.turnosPorEspecialidadLabels = [];
      this.turnosPorEspecialidadData = [{ data: [], label: 'Turnos' }];
      return;
    }

    const especialidadCounts: { [key: string]: number } = {};
    (data || []).forEach((turno: any) => {
      const especialidad = turno.especialidad || 'Desconocida';
      especialidadCounts[especialidad] = (especialidadCounts[especialidad] || 0) + 1;
    });

    this.turnosPorEspecialidadLabels = Object.keys(especialidadCounts);
    this.turnosPorEspecialidadData = [{
      data: Object.values(especialidadCounts),
      label: 'Turnos por Especialidad',
      backgroundColor: this.generateRandomColors(this.turnosPorEspecialidadLabels.length)
    }];
  }

  exportTurnosPorEspecialidadToExcel() {
    const dataToExport = this.turnosPorEspecialidadLabels.map((label, index) => ({
      'Especialidad': label,
      'Cantidad de Turnos': this.turnosPorEspecialidadData[0].data[index]
    }));
    this.exportToExcel(dataToExport, 'turnos_por_especialidad');
  }

  // --- CANTIDAD DE TURNOS POR DÍA ---
  async loadTurnosPorDia() {
    let query = supabase.from('turnos').select('fecha_hora');

    if (this.fechaDesde) {
      query = query.gte('fecha_hora', this.fechaDesde + 'T00:00:00Z');
    }
    if (this.fechaHasta) {
      query = query.lte('fecha_hora', this.fechaHasta + 'T23:59:59Z');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al cargar turnos por día:', error);
      this.turnosPorDiaLabels = [];
      this.turnosPorDiaData = [{ data: [], label: 'Turnos', backgroundColor: '#4CAF50' }];
      return;
    }

    const dayCounts: { [key: string]: number } = {};
    (data || []).forEach((turno: any) => {
      const date = this.datePipe.transform(turno.fecha_hora, 'yyyy-MM-dd');
      if (date) {
        dayCounts[date] = (dayCounts[date] || 0) + 1;
      }
    });

    // Ordenar por fecha
    const sortedDates = Object.keys(dayCounts).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    this.turnosPorDiaLabels = sortedDates.map(date => this.datePipe.transform(date, 'dd/MM/yyyy') || date);
    this.turnosPorDiaData = [{
      data: sortedDates.map(date => dayCounts[date]),
      label: 'Turnos por Día',
      backgroundColor: '#4CAF50'
    }];
  }

  exportTurnosPorDiaToExcel() {
    const dataToExport = this.turnosPorDiaLabels.map((label, index) => ({
      'Día': label,
      'Cantidad de Turnos': this.turnosPorDiaData[0].data[index]
    }));
    this.exportToExcel(dataToExport, 'turnos_por_dia');
  }

  // --- INFORMES POR MÉDICO ---
  async loadMedicos() {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, apellido')
      .eq('tipo_usuario', 'especialista')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error al cargar médicos:', error);
      this.medicos = [];
      return;
    }
    this.medicos = data || [];
  }

  async cargarInformesMedico() {
    if (!this.medicoSeleccionado) {
      this.turnosSolicitadosMedicoLabels = [];
      this.turnosSolicitadosMedicoData = [{ data: [], label: 'Estado del Turno' }];
      this.turnosFinalizadosMedicoLabels = [];
      this.turnosFinalizadosMedicoData = [{ data: [], label: 'Duración (min)' }];
      this.selectedMedicoName = '';
      return;
    }

    const selectedMedico = this.medicos.find(m => m.id === this.medicoSeleccionado);
    this.selectedMedicoName = selectedMedico ? `${selectedMedico.nombre} ${selectedMedico.apellido}` : '';

    await this.loadTurnosSolicitadosMedico();
    await this.loadTurnosFinalizadosMedico();
  }

  // Cantidad de turnos solicitado por médico en un lapso de tiempo.
  async loadTurnosSolicitadosMedico() {
    let query = supabase.from('turnos')
      .select('estado')
      .eq('especialista_id', this.medicoSeleccionado);

    if (this.fechaDesde) {
      query = query.gte('fecha_hora', this.fechaDesde + 'T00:00:00Z');
    }
    if (this.fechaHasta) {
      query = query.lte('fecha_hora', this.fechaHasta + 'T23:59:59Z');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al cargar turnos solicitados por médico:', error);
      this.turnosSolicitadosMedicoLabels = [];
      this.turnosSolicitadosMedicoData = [{ data: [], label: 'Estado del Turno' }];
      return;
    }

    const estadoCounts: { [key: string]: number } = {};
    (data || []).forEach((turno: any) => {
      const estado = turno.estado || 'Desconocido';
      estadoCounts[estado] = (estadoCounts[estado] || 0) + 1;
    });

    this.turnosSolicitadosMedicoLabels = Object.keys(estadoCounts).map(estado => this.estadoTurnoPipe.transform(estado));
    this.turnosSolicitadosMedicoData = [{
      data: Object.values(estadoCounts),
      label: 'Estados de Turnos',
      backgroundColor: this.generateRandomColors(this.turnosSolicitadosMedicoLabels.length)
    }];
  }

  exportTurnosSolicitadosMedicoToExcel() {
    const dataToExport = this.turnosSolicitadosMedicoLabels.map((label, index) => ({
      'Estado del Turno': label,
      'Cantidad': this.turnosSolicitadosMedicoData[0].data[index]
    }));
    this.exportToExcel(dataToExport, `turnos_solicitados_${this.selectedMedicoName.replace(/\s/g, '_')}`);
  }

  // Cantidad de turnos finalizados por médico en un lapso de tiempo.
  async loadTurnosFinalizadosMedico() {
    let query = supabase.from('turnos')
      .select('historia_clinica->diagnostico') // Asume que el diagnóstico implica finalizado
      .eq('especialista_id', this.medicoSeleccionado)
      .eq('estado', 'finalizado'); // Filtramos por estado finalizado

    if (this.fechaDesde) {
      query = query.gte('fecha_hora', this.fechaDesde + 'T00:00:00Z');
    }
    if (this.fechaHasta) {
      query = query.lte('fecha_hora', this.fechaHasta + 'T23:59:59Z');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al cargar turnos finalizados por médico:', error);
      this.turnosFinalizadosMedicoLabels = [];
      this.turnosFinalizadosMedicoData = [{ data: [], label: 'Duración (min)' }];
      return;
    }

    // Para este informe, si no hay una duración explícita, se puede estimar o agrupar por diagnóstico/tipo.
    // Asumiré un 'diagnóstico' como indicador de finalización y contaré por eso.
    // Si necesitas un cálculo de duración real, la tabla 'turnos' debería tener 'hora_inicio_real' y 'hora_fin_real'.
    const diagnosticoCounts: { [key: string]: number } = {};
    (data || []).forEach((turno: any) => {
      const diagnostico = turno.diagnostico || 'Sin Diagnóstico'; // O el campo real que uses para diagnostico
      diagnosticoCounts[diagnostico] = (diagnosticoCounts[diagnostico] || 0) + 1;
    });

    this.turnosFinalizadosMedicoLabels = Object.keys(diagnosticoCounts);
    this.turnosFinalizadosMedicoData = [{
      data: Object.values(diagnosticoCounts),
      label: 'Turnos Finalizados por Diagnóstico/Tipo',
      backgroundColor: this.generateRandomColors(this.turnosFinalizadosMedicoLabels.length)
    }];
  }

  exportTurnosFinalizadosMedicoToExcel() {
    const dataToExport = this.turnosFinalizadosMedicoLabels.map((label, index) => ({
      'Diagnóstico/Tipo': label,
      'Cantidad': this.turnosFinalizadosMedicoData[0].data[index]
    }));
    this.exportToExcel(dataToExport, `turnos_finalizados_${this.selectedMedicoName.replace(/\s/g, '_')}`);
  }

  // --- FUNCIONES AUXILIARES PARA EXPORTACIÓN Y GRÁFICOS ---

  // Genera colores aleatorios para los gráficos
  private generateRandomColors(numColors: number): string[] {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
      const r = Math.floor(Math.random() * 255);
      const g = Math.floor(Math.random() * 255);
      const b = Math.floor(Math.random() * 255);
      colors.push(`rgba(${r}, ${g}, ${b}, 0.6)`);
    }
    return colors;
  }

  // Exportar a Excel
  exportToExcel(data: any[], fileName: string): void {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = { Sheets: { 'data': ws }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, fileName);
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    FileSaver.saveAs(data, fileName + '_' + new Date().getTime() + '.xlsx');
  }

  // Exportar a PDF (HTML a PDF)
  exportHtmlToPdf(element: HTMLElement, fileName: string): void {
    html2canvas(element, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 200;
      const pageHeight = 295;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 5, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 5, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(fileName);
    });
  }

  // Descargar gráfico como PDF
  downloadChart(elementId: string, fileName: string, chartType: ChartType): void {
    const element = document.getElementById(elementId);
    if (element) {
      // Find the canvas within the element
      const canvas = element.querySelector('canvas');
      if (canvas) {
        html2canvas(canvas, { scale: 2, backgroundColor: '#ffffff' }).then(chartCanvas => { // Ensure white background
          const imgData = chartCanvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const imgWidth = 180; // A bit smaller for padding
          const imgHeight = chartCanvas.height * imgWidth / chartCanvas.width;
          const x = (pdf.internal.pageSize.getWidth() - imgWidth) / 2; // Center horizontally
          const y = (pdf.internal.pageSize.getHeight() - imgHeight) / 2; // Center vertically

          pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
          pdf.save(fileName + '.pdf');
        });
      } else {
        console.error('No se encontró el elemento canvas dentro de la sección:', elementId);
      }
    } else {
      console.error('No se encontró la sección del informe:', elementId);
    }
  }

  // Pipe personalizado para traducir el estado del turno (ejemplo para usar EstadoTurnoPipe)
  private estadoTurnoPipe = new EstadoTurnoPipe();
}