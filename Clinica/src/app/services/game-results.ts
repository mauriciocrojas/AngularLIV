import { Injectable } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GameResultsService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.apiUrl, environment.publicAnonKey);
  }

  async saveResult(game: string, score: number): Promise<void> {
    const { data: sessionData, error: sessionError } = await this.supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (!user) {
      console.error('Usuario no logueado');
      return;
    }

    const { error } = await this.supabase.from('results_games').insert({
      user: user.id,
      email: user.email,
      game: game,
      score: score
    });

    if (error) {
      console.error('Error al guardar resultado:', error);
    } else {
      console.log('Resultado guardado correctamente');
    }
  }
}
