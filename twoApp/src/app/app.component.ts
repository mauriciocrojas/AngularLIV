import { Component } from '@angular/core';
import { LoginComponent } from './componentes/login/login.component';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [LoginComponent,FormsModule,RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'twoApp';
}
