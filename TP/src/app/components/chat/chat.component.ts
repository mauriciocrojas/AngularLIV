import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { Message } from '../../models/message.interface';
import { FormsModule } from '@angular/forms';  // Importa FormsModule para usar ngModel
import { CommonModule } from '@angular/common';  // Importa CommonModule para usar el pipe 'date'


@Component({
  selector: 'app-chat',
  standalone: true,  // Marca el componente como standalone
  imports: [FormsModule, CommonModule],  // Asegúrate de importar estos módulos
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  @ViewChild('chatContainer') chatContainer!: ElementRef;

  messages: Message[] = [];
  newMessage: string = '';
  isUserLoggedIn: boolean = false;
  emptyMessageWarning: boolean = false;
  userEmail: string = '';

  constructor(private chatService: ChatService) {}

  async ngOnInit(): Promise<void> {
    const user = await this.chatService.getUser();
    this.isUserLoggedIn = !!user;
    this.userEmail = user?.email || '';
  
    // Obtener los mensajes iniciales
    const messages = await this.chatService.getMessages();
    this.messages = messages;
    this.scrollToBottom();
  
    // Suscribirse a nuevos mensajes
    this.chatService.onNewMessage((msg) => {
      this.messages = [...this.messages, msg];  // Actualiza el arreglo de mensajes
      this.scrollToBottom();  // Hacer scroll hacia abajo
    });
  }
  

  send(): void {
    if (this.newMessage.trim() === '') {
      this.emptyMessageWarning = true;
      return;
    }

    this.chatService.sendMessage(this.newMessage, this.userEmail);
    this.newMessage = '';
    this.emptyMessageWarning = false;
  }

  scrollToBottom(): void {
    setTimeout(() => {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    }, 100);
  }

  goHome(): void {
    // Implementar navegación
  }

  onScroll(): void {
    // Scroll manual si querés hacer algo con scroll
  }
}
