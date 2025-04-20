import { Component, OnInit } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { UserData } from '../../models/user-data';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {

  usersdata: UserData[] = [];
  userEmail: string | null = null;
  isLoggedIn: boolean = false; // Estado para saber si el usuario está logueado

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.checkSession();
    this.getUserData();
  }

  async checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      this.isLoggedIn = true;
      this.userEmail = session.user.email ?? null;
    } else {
      this.isLoggedIn = false;
    }
  }

  getUserData() {
    supabase.from('users-data').select('*').then(({ data, error }) => {
      if (error) {
        console.error('Error:', error.message);
      } else {
        this.usersdata = data;
        this.usersdata.forEach(user => {
          console.log('Avatar URL:', this.getAvatarUrl(user.avatarUrl));
        });
      }
    });
  }

  getAvatarUrl(avatarUrl: string) {
    return supabase.storage.from('images').getPublicUrl(avatarUrl).data.publicUrl;
  }

  logout() {
    supabase.auth.signOut().then(() => {
      this.router.navigate(['/login']);
    }).catch((error) => {
      console.error('Error al cerrar sesión:', error.message);
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
