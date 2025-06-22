import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanActivate {

  constructor(private router: Router) {}

  async canActivate(): Promise<boolean> {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      this.router.navigate(['/login']);
      return false;
    }

    const { data, error: err } = await supabase
      .from('usuarios')
      .select('tipo_usuario')
      .eq('id', user.id)
      .single();

    if (err || !data) {
      this.router.navigate(['/login']);
      return false;
    }

    if (data.tipo_usuario !== 'administrador') {
      this.router.navigate(['/home']);
      return false;
    }

    return true;
  }
}
