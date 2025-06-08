import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { Message } from '../../models/message.interface';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';  // Asegúrate de importar ReactiveFormsModule
import { RealtimeChannel } from '@supabase/supabase-js';
import { CommonModule } from '@angular/common';  // Asegúrate de importar CommonModule
import { Router } from '@angular/router';  // Importamos Router para la navegación

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class ChatComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  userEmail: string | null = null;
  currentUserId: string | null = null;
  isUserLoggedIn: boolean = false;
  emptyMessageWarning: boolean = false;
  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  private channel: RealtimeChannel | null = null;
  messageForm: FormGroup;

  constructor(
    private chatService: ChatService,
    private auth: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private router: Router  // Inyectamos Router
  ) {
    this.messageForm = this.fb.group({
      newMessage: ['', Validators.required],
    });
  }

  async ngOnInit() {
    await this.initializeUser();
    await this.loadMessages();
    this.scrollToBottom();  // Asegúrate de desplazarte al último mensaje
    this.subscribeToRealtimeMessages();
  }


  ngOnDestroy(): void {
    if (this.channel) {
      this.channel.unsubscribe();
    }
  }

  private async initializeUser() {
    const { user } = await this.auth.getUser();
    this.userEmail = user?.email ?? null;
    this.currentUserId = user?.id ?? null;
    this.isUserLoggedIn = !!this.userEmail;
  }

  private async loadMessages() {
    this.messages = await this.chatService.fetchMessages();
    this.cdr.detectChanges();
  }

  private subscribeToRealtimeMessages() {
    this.channel = this.chatService.subscribeToMessages((msg: Message) => {
      this.messages.push(msg);
      this.cdr.detectChanges();
      this.scrollToBottom();  // Desplazar automáticamente al recibir un nuevo mensaje
    });
  }

  async send() {
    this.emptyMessageWarning = false;

    if (this.messageForm.invalid) {
      this.emptyMessageWarning = true;
      return;
    }

    const success = await this.chatService.sendMessage(this.messageForm.value.newMessage);
    if (success) {
      this.messageForm.reset();
      // await this.loadMessages();
      // this.scrollToBottom();  // Desplazar al último mensaje después de enviar
      // this.cdr.detectChanges();
    }
  }

  isMyMessage(userId: string): boolean {
    return this.currentUserId === userId;
  }

  private scrollToBottom(): void {
    try {
      if (this.chatContainer && this.chatContainer.nativeElement) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error al hacer scroll:', err);
    }
  }


  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  onEnter(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === "Enter") {
      event.preventDefault();
      this.send();
    }
  }

  // Método goHome()
  goHome() {
    this.router.navigate(['/home']);  // Redirige a la ruta /home
  }
}
