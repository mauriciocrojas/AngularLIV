import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
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
  styleUrls: ['./chat.component.css'], // Asegúrate de que sea 'styleUrls' y no 'styleUrl'
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  messages: Message[] = [];
  userEmail: string | null = null;
  currentUserId: string | null = null; // Cambié 'loggedInUserId' a 'currentUserId'
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
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
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
    this.currentUserId = user?.id ?? null; // Asigné el ID del usuario logueado
    this.isUserLoggedIn = !!this.userEmail;
  }

  private async loadMessages() {
    this.messages = await this.chatService.fetchMessages();
  }

  private subscribeToRealtimeMessages() {
    this.channel = this.chatService.subscribeToMessages((msg: Message) => {
      this.messages.push(msg);
      this.scrollToBottom();
      this.cdr.detectChanges(); // Manually trigger change detection
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
    }
  }

  isMyMessage(userId: string): boolean {
    return this.currentUserId === userId; // Lógica para comprobar si el mensaje es del usuario logueado
  }

  goHome() {
    window.location.href = '/home';
  }

  private scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch (err) {}
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
