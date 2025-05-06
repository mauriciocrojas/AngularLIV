import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { Router } from '@angular/router';
import { Message } from '../../models/message.interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// import { SupabaseService } from 'src/app/supabase.service';  // Importar servicio de Supabase

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  newMessage: string = '';
  userId: string = '';
  isUserLoggedIn: boolean = false;

  @ViewChild('chatContainer') chatContainer!: ElementRef;

  constructor(
    private chatService: ChatService, 
    private router: Router,
    // private supabase: SupabaseService  // Inyectamos el servicio de Supabase
  ) {}

  async ngOnInit() {
    const user = await this.chatService.getUser(); // Llamamos al método getUser
  
    if (user) {
      this.userId = user.id;
      this.isUserLoggedIn = true;
    } else {
      this.isUserLoggedIn = false;
    }

    // Obtener los mensajes iniciales
    this.messages = await this.chatService.getMessages();
    this.scrollToBottom();

    // Suscribirse a nuevos mensajes
    this.chatService.onNewMessage((msg) => {
      this.messages.push(msg);
      this.scrollToBottom();
    });
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.chatContainer) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  ngOnDestroy(): void {
    // Aquí ya no es necesario manejar la suscripción manualmente
  }
}
