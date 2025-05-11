import { Component, OnInit, OnDestroy } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { Message } from '../../models/message.interface';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RealtimeChannel } from '@supabase/supabase-js';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  newMessage: string = '';
  userEmail: string | null = null;
  isUserLoggedIn: boolean = false;
  emptyMessageWarning: boolean = false;

  private channel: RealtimeChannel | null = null;

  constructor(private chatService: ChatService, private auth: AuthService) {}

  async ngOnInit() {
    await this.initializeUser();  // Inicializa al usuario logueado
    await this.loadMessages();    // Carga los mensajes históricos
    this.channel = this.chatService.subscribeToMessages((msg: Message) => {
      this.messages.push(msg);  // Agrega los mensajes nuevos que lleguen en tiempo real
    });
  }
  

  ngOnDestroy(): void {
    this.chatService.removeSubscription();
  }

  private async initializeUser() {
    const { user } = await this.auth.getUser();
    this.userEmail = user?.email ?? null;
    this.isUserLoggedIn = !!this.userEmail;
  }

  private async loadMessages() {
    this.messages = await this.chatService.fetchMessages();
  }

  private subscribeToRealtimeMessages() {
    this.channel = this.chatService.subscribeToMessages((msg: Message) => {
      this.messages.push(msg);
    });
  }

  async send() {
    this.emptyMessageWarning = false;
  
    if (!this.newMessage.trim()) {
      this.emptyMessageWarning = true;
      return;
    }
  
    const success = await this.chatService.sendMessage(this.newMessage);
    if (success) {
      this.newMessage = '';  // Limpiar mensaje solo si fue exitoso
    }
  }
  
  

  goHome() {
    // Puedes usar Router.navigate si tenés Router inyectado, esto es una alternativa simple
    window.location.href = '/home';
  }
}
