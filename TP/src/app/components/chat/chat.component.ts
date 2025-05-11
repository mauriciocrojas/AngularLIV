import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { Message } from '../../models/message.interface';
import { AuthService } from '../../services/auth.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RealtimeChannel } from '@supabase/supabase-js';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {
  messages: Message[] = [];
  userEmail: string | null = null;
  currentUserId: string | null = null;
  isUserLoggedIn: boolean = false;
  emptyMessageWarning: boolean = false;
  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  private channel: RealtimeChannel | null = null;
  messageForm: FormGroup;
  private subscription: Subscription | null = null;

  constructor(
    private chatService: ChatService,
    private auth: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.messageForm = this.fb.group({
      newMessage: ['', Validators.required],
    });
  }

  async ngOnInit() {
    await this.initializeUser();
    await this.loadMessages();
    this.subscribeToRealtimeMessages();
  }

  ngAfterViewInit(): void {
    // Asegura el scroll después de que la vista esté totalmente cargada
    setTimeout(() => {
      this.scrollToBottom();
    }, 0);
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.chatService.removeSubscription();
  }

  private async initializeUser() {
    const { user } = await this.auth.getUser();
    this.userEmail = user?.email ?? null;
    this.currentUserId = user?.id ?? null;
    this.isUserLoggedIn = !!this.userEmail;
  }

  private async loadMessages() {
    this.messages = await this.chatService.fetchMessages();
    this.cdr.detectChanges(); // Asegura que los mensajes se rendericen antes del scroll
  }

  private subscribeToRealtimeMessages() {
    this.channel = this.chatService.subscribeToMessages((msg: Message) => {
      this.messages.push(msg);
      this.cdr.detectChanges();
      this.scrollToBottom();
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
      await this.loadMessages();
      this.scrollToBottom();
      this.cdr.detectChanges();
    }
  }

  isMyMessage(userId: string): boolean {
    return this.currentUserId === userId;
  }

  goHome() {
    window.location.href = '/home';
  }

  private scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
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
}
