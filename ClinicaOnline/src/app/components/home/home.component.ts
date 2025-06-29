import { Component, OnInit } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']  // Cambié a .css
})
export class HomeComponent implements OnInit {

  userEmail: string | null = null;
  isLoggedIn: boolean = false;
  esAdmin: boolean = false;
  tipoUsuario: string | null = null;
  cargandoUsuarios: boolean = false;

  constructor(private router: Router) { }

  async ngOnInit() {
    await this.checkSession();
    if (this.isLoggedIn) {
      await this.loadUserType();
    }
  }

  async checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      this.isLoggedIn = true;
      this.userEmail = session.user.email ?? null;
    } else {
      this.isLoggedIn = false;
      this.userEmail = null;
      this.esAdmin = false;
      this.tipoUsuario = null;
    }
  }

  async loadUserType() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const userId = session.user.id;
    const { data, error } = await supabase
      .from('usuarios')
      .select('tipo_usuario')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('Error al obtener tipo_usuario:', error?.message);
      this.esAdmin = false;
      this.tipoUsuario = null;
      return;
    }

    this.tipoUsuario = data.tipo_usuario;
    this.esAdmin = data.tipo_usuario === 'administrador';
  }

  logout() {
    supabase.auth.signOut().then(() => {
      this.isLoggedIn = false;
      this.userEmail = null;
      this.esAdmin = false;
      this.tipoUsuario = null;
      this.router.navigate(['/login']);
    }).catch((error) => {
      console.error('Error al cerrar sesión:', error.message);
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  irAUsuarios() {
    this.cargandoUsuarios = true;
    setTimeout(() => {
      this.router.navigate(['/usuarios']);
    }, 700);
  }

   irAInformes() {
    this.cargandoUsuarios = true;
    setTimeout(() => {
      this.router.navigate(['/informes']);
    }, 700);
  }


  irATurnos() {
    this.router.navigate(['/turnos']);
  }

  irASolicitarTurnos() {
    this.router.navigate(['/solicitar-turno']);
  }
  irAMiPerfil() {
    this.router.navigate(['/mi-perfil']);
  }
  irAPacientes() {
    this.router.navigate(['/pacientes']);
  }

}
