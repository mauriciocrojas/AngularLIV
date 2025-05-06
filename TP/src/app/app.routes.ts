import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home', // Redirecciona a /home cuando la ruta esté vacía
    pathMatch: 'full',    // Asegúrate de que la ruta coincida completamente
  },
  {
    path: 'home',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent),
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
    path: 'quien-soy',
    loadComponent: () => import('./components/quien-soy/quien-soy.component').then(m => m.QuienSoyComponent),
  },
  {
    path: 'lista-jugadores',
    loadComponent: () => import('./components/lista-jugadores/lista-jugadores.component').then(m => m.ListaJugadoresComponent),
  },
  {
    path: 'ahorcado',
    loadChildren: () => import('./games/ahorcado/ahorcado.module').then(m => m.AhorcadoModule)
  },
  {
    path: 'chat',
    loadComponent: () => import('./components/chat/chat.component').then(m => m.ChatComponent)
  }
  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)], // Importa RouterModule y configura las rutas
  exports: [RouterModule] // Asegúrate de exportar RouterModule
})
export class AppRoutingModule { }
