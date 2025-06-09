import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { Router, RouterModule } from '@angular/router';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  selector: 'app-lista-jugadores',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './lista-jugadores.component.html',
  styleUrl: './lista-jugadores.component.scss'
})
export class ListaJugadoresComponent implements OnInit {
  isLoggedIn: boolean = false;
  userEmail: string | null = null;

  gameResults: {
    game: string;
    data: {
      email: string;
      fecha: string;
      score: string;
    }[];
  }[] = [];

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.checkSession();
    this.getAllGameResults();
  }

  async checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    this.isLoggedIn = !!session;
    this.userEmail = session?.user.email ?? null;
  }

  async getAllGameResults() {
    const { data, error } = await supabase.from('results_games').select('*');

    if (error) {
      console.error('Error obteniendo resultados:', error.message);
      return;
    }

    const groupedResults: { [key: string]: any[] } = {};

    for (const entry of data) {
      if (!groupedResults[entry.game]) {
        groupedResults[entry.game] = [];
      }

      groupedResults[entry.game].push({
        email: entry.email,
        fecha: entry.created_at,
        score: entry.score
      });
    }

    this.gameResults = Object.keys(groupedResults).map(game => ({
      game,
      data: groupedResults[game]
    }));
  }

    // Método goHome()
  goHome() {
    this.router.navigate(['/home']);  // Redirige a la ruta /home
  }

//   getUserData() {
//     supabase.from('users-data').select('*').then(({ data, error }) => {
//       if (error) {
//         console.error('Error:', error.message);
//       } else {
//         this.usersdata = data;
//         this.usersdata.forEach(user => {
//           console.log('Avatar URL:', this.getAvatarUrl(user.avatarUrl));
//         });
//       }
//     });
//   }

//   getAvatarUrl(avatarUrl: string) {
//     return supabase.storage.from('images').getPublicUrl(avatarUrl).data.publicUrl;
//   }
// }

}
