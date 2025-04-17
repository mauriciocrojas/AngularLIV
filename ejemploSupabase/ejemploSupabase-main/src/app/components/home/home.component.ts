import { Component, OnInit } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { UserData } from '../../models/user-data';
import { environment } from '../../../environments/environment';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey);

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {

  usersdata: UserData[] = [];

  ngOnInit(): void {
    this.getUserData();
  }

  getUserData() {
    supabase.from('users-data').select('*').then(({ data, error }) => {
      if (error) {
        console.error('Error:', error.message);
      } else {
        console.log('Data:', data);
        this.usersdata = data;
      }
    }
    );
  }

  getAvatarUrl(avatarUrl: string) {
    return supabase.storage.from('images').getPublicUrl(avatarUrl).data.publicUrl;
  }

}
