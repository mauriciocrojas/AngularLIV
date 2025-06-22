import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { AdminGuard } from './guards/admin.guard';


export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home', // Redirecciona a /home cuando la ruta esté vacía
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent),
    data: { animation: 'HomePage' }
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'mi-perfil',
    loadComponent: () => import('./components/mi-perfil/mi-perfil.component').then(m => m.MiPerfilComponent),
  },
  {
    path: 'solicitar-turno',
    loadComponent: () => import('./components/solicitar-turno/solicitar-turno.component').then(m => m.SolicitarTurnosComponent),
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./components/usuarios/usuarios.component').then(m => m.UsuariosComponent),
    data: { animation: 'UsuariosPage' },
    canActivate: [AdminGuard]
  },
  {
    path: 'turnos',
    loadComponent: () => import('./components/turnos/turnos.component').then(m => m.TurnosComponent)
  },
  {
    path: 'pacientes',
    loadComponent: () => import('./components/pacientes/pacientes.component').then(m => m.PacientesComponent)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)], // Importa RouterModule y configura las rutas
  exports: [RouterModule]
})
export class AppRoutingModule { }
