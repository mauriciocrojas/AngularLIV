// chat.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Message } from '../models/message.interface'; 
import { Subscription } from 'rxjs';

interface NewMessageType {
  id: string;
  message: string;
  created_at: string;
  user_id: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService implements OnDestroy {
  private supabase: SupabaseClient;
  private channel: RealtimeChannel | null = null;
  private loggedInUserId: string | null = null; // Para almacenar el ID del usuario logueado

  constructor(private auth: AuthService) {
    this.supabase = auth.getClient();
    this.loadLoggedInUserId(); // Cargar el ID al inicializar el servicio
  }

  private async loadLoggedInUserId() {
    const { user } = await this.auth.getUser();
    this.loggedInUserId = user?.id || null;
  }

  // Método para obtener los mensajes
  async fetchMessages(): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .select(`
        id,
        message,
        created_at,
        user_id,
        "users-data" (
          name
        )
      `)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error obteniendo los mensajes:', error);
      return [];
    }

    if (!data) {
      console.warn('No se han encontrado mensajes.');
      return [];
    }

    const messages: Message[] = data.map((item: any) => { // Se tipifica explícitamente 'item' como 'any'
      let username = 'Unknown'; // Valor por defecto

      if (item && item["users-data"]) {
        if (Array.isArray(item["users-data"]) && item["users-data"].length > 0) {
          username = item["users-data"][0]?.name || 'Unknown';
        } else if (typeof item["users-data"] === 'object' && item["users-data"] !== null) {
          username = item["users-data"]?.name || 'Unknown';
        }
      }

      return {
        id: item.id,
        message: item.message,
        created_at: item.created_at,
        user_id: item.user_id,
        username: username,
      };
    });

    return messages;
  }

  // Método para enviar un mensaje
  async sendMessage(content: string): Promise<boolean> {
    const { user } = await this.auth.getUser();

    if (!user) {
      console.error('No authenticated user');
      return false;
    }

    const userId = user.id;

    const { data, error } = await this.supabase.from('chat_messages').insert([{
      message: content.trim(),
      user_id: userId,
    }]).select(); // Important: Select the inserted data to get the new message

    if (error) {
      console.error('Error sending message:', error.message);
      return false;
    }
    return true;
  }

  // Suscripción a mensajes en tiempo real
  subscribeToMessages(onNewMessage: (msg: Message) => void): RealtimeChannel {
    this.channel = this.supabase.channel('messages-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, async (payload) => {
        const newMessage = payload.new as NewMessageType;

        let username = 'Unknown';

        // Fetch user data
        const { data: userData, error: userError } = await this.supabase
          .from('users-data')
          .select('name')
          .eq('authid', newMessage.user_id)
          .single();

        if (!userError && userData) {
          username = userData.name || 'Unknown';
        } else {
          console.error('Error fetching user name:', userError);
        }

        const message: Message = {
          id: newMessage.id,
          message: newMessage.message,
          created_at: newMessage.created_at,
          user_id: newMessage.user_id,
          username: username
        };

        onNewMessage(message);
      })
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return this.channel;
  }

  // Desuscribirse de los mensajes en tiempo real
  removeSubscription(): void {
    if (this.channel) {
      this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }

  getLoggedInUserId(): string | null {
    return this.loggedInUserId;
  }

  ngOnDestroy(): void {
    this.removeSubscription();
  }
}
