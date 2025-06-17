import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';

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

  constructor(private authService: AuthService, private router: Router) { }

  async ngOnInit() {
  try {
    this.usuario = await this.authService.getUser();
    this.esEspecialista = this.usuario?.tipo_usuario === 'especialista';
    this.esPaciente = this.usuario?.tipo_usuario === 'paciente';

    // Parsear especialidades
    try {
      const parsed = JSON.parse(this.usuario.especialidad);
      this.especialidadesDisponibles = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      this.especialidadesDisponibles = [this.usuario.especialidad];
    }
    this.nueva.especialidad = this.especialidadesDisponibles[0] || '';

    // Levantar imágenes desde usuario.imagenes (text[] tipo JSON)
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

    // Disponibilidad especialista
    if (this.esEspecialista) {
      const { data, error } = await supabase
        .from('disponibilidad_especialista')
        .select('*')
        .eq('especialista_id', this.usuario.id);
      if (!error && data) {
        this.disponibilidad = data;
      }
    }
  } catch (err) {
    this.error = 'Error al cargar perfil.';
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
      fecha: this.nueva.fecha, // YYYY-MM-DD
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
