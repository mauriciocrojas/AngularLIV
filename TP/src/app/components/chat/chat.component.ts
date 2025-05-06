import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { Router } from '@angular/router';
import { Message } from '../../models/message.interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})export class ChatComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  newMessage: string = '';
  userId: string = '';
  isUserLoggedIn: boolean = false;
  isAtBottom: boolean = true;  // Variable para verificar si el scroll está en el fondo
  emptyMessageWarning: boolean = false; // Variable para mostrar la advertencia de mensaje vacío

  @ViewChild('chatContainer') chatContainer!: ElementRef;

  constructor(
    private chatService: ChatService, 
    private router: Router,
    private cdr: ChangeDetectorRef // Inyectamos ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const user = await this.chatService.getUser();
  
    if (user) {
      this.userId = user.id;
      this.isUserLoggedIn = true;
    } else {
      this.isUserLoggedIn = false;
    }

    // Obtener los mensajes iniciales
    this.messages = await this.chatService.getMessages();
    this.scrollToBottom(); // Mover al último mensaje

    // Suscribirse a nuevos mensajes
    this.chatService.onNewMessage((msg) => {
      this.messages.push(msg);
      this.scrollToBottom(); // Mover al último mensaje cuando se recibe uno nuevo
    });
  }

  // Función para enviar el mensaje
  async send() {
    if (this.newMessage.trim() === '' || !this.userId) {
      this.emptyMessageWarning = true; // Activamos la advertencia si el mensaje está vacío
      return;
    }
  
    const messageText = this.newMessage.trim();
    const timestamp = new Date().toISOString();
  
    const { error } = await this.chatService['supabase']
      .from('chat_messages')
      .insert([
        {
          user_id: this.userId,
          message: messageText,
          created_at: timestamp
        }
      ]);
  
    if (error) {
      console.error('Error al enviar el mensaje:', error);
      return;
    }
  
    const newMessage: Message = {
      id: Date.now(), // ID temporal
      user_id: this.userId,
      message: messageText,
      created_at: timestamp,
      username: (await this.chatService.getUserName(this.userId)) || 'Tú'
    };
  
    this.messages.push(newMessage);
    this.newMessage = ''; // Limpiar campo de texto

    // Usamos un setTimeout para asegurarnos de que Angular haya procesado los cambios
    setTimeout(() => {
      this.scrollToBottom(); // Desplazar al fondo
    });

    this.emptyMessageWarning = false; // Desactivar la advertencia después de enviar el mensaje
  }

  // Comprobar si el scroll está en el fondo
  onScroll() {
    const container = this.chatContainer.nativeElement;
    this.isAtBottom = container.scrollHeight - container.scrollTop === container.clientHeight;
  }

  // Función para desplazar el scroll al fondo
  scrollToBottom(): void {
    // Usamos ChangeDetectorRef para forzar la detección de cambios
    this.cdr.detectChanges();
    
    const container = this.chatContainer.nativeElement;
    if (this.isAtBottom) {
      container.scrollTop = container.scrollHeight;
    }
  }

  // Función para volver al home
  goHome() {
    this.router.navigate(['/home']);
  }

  ngOnDestroy(): void {
    // Limpiar suscripciones, si es necesario
  }
}
