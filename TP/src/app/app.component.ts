import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';  // Importar FormsModule
import { ChatComponent } from './components/chat/chat.component';  // Ruta correcta a tu componente Chat

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FormsModule, ChatComponent],  // Asegúrate de agregarlo aquí
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'ejemploSupabase';
}
