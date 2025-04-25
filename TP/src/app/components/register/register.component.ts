import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { createClient, User } from '@supabase/supabase-js'
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey)

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
username: string;
password: string;
name: string = '';
age: number = 0;
avatarFile: File | null = null;
errorMessage: string | null = null;


constructor(private router: Router) {
  this.username = '';
  this.password = '';
}


register() {
  this.errorMessage = null; // Limpiar mensaje anterior
  supabase.auth.signUp({
    email: this.username,
    password: this.password,
  }).then(({ data, error }) => {
    if (error) {
      console.error('Error:', error.message);
      this.errorMessage = error.message; // Mostrar mensaje
    } else {
      this.router.navigate(['/home']);
      console.log('User registered:', data.user);
      this.saveUserData(data.user!);
    }
  });
}

saveUserData(user: User) {

  const avatarUrl = this.saveFile().then((data) => {
    if (data) {

  supabase.from('users-data').insert([
    { authId: user.id, name: this.name, age: this.age, avatarUrl: data.path  }
  ]).then(({ data, error }) => {
    if (error) {
      console.error('Error:', error.message);
    } else {
      this.router.navigate(['/home']);
    }
  });
}
});

}

// upload the file
async saveFile() {

  const { data, error } = await supabase
    .storage
    .from('images')
    .upload(`users/${this.avatarFile?.name}`, this.avatarFile!, {
      cacheControl: '3600',
      upsert: false
    });

  return data;
}


onFileSelected(event: any) {
  this.avatarFile = event.target.files[0];
}


}
