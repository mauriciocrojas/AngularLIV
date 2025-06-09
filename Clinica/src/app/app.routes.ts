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
    path: 'usuarios',
    loadComponent: () => import('./components/usuarios/usuarios.component').then(m => m.UsuariosComponent),
    canActivate: [AdminGuard]
  }
  ,
  {
    path: 'chat',
    loadComponent: () => import('./components/chat/chat.component').then(m => m.ChatComponent)
  },
  {
    path: 'encuesta',
    loadComponent: () => import('./components/encuesta/encuesta.component').then(m => m.EncuestaComponent)
  },
  {
    path: 'games',  // Ruta base para los juegos
    loadChildren: () => import('./games/games.module').then(m => m.GamesModule)  // Carga del módulo de juegos
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)], // Importa RouterModule y configura las rutas
  exports: [RouterModule]
})
export class AppRoutingModule { }
