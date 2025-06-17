// src/app/core/services/auth.service.ts

import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.apiUrl, environment.publicAnonKey);
  }

  // Obtiene el cliente de Supabase para usarse en otros servicios
  getClient(): SupabaseClient {
    return this.supabase;
  }

  // Obtiene el usuario actualmente logueado con datos extendidos
  async getUser() {
    const { data: authData } = await this.supabase.auth.getUser();
    const user = authData?.user;
    if (!user) return null;

    const { data: perfil, error } = await this.supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error al obtener perfil del usuario:', error.message);
      return null;
    }

    return { ...user, ...perfil };
  }

  // Inicia sesión con email y password
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error signing in:', error.message);
      return null;
    }

    return data.user;
  }

  // Registra un nuevo usuario
  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Error signing up:', error.message);
      return null;
    }

    return data.user;
  }

  // Cierra la sesión del usuario
  async signOut() {
    await this.supabase.auth.signOut();
  }
}
