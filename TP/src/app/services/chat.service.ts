import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Message } from '../models/message.interface';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private supabase: SupabaseClient;
  private chatChannel: RealtimeChannel | null = null;

  constructor() {
    this.supabase = createClient(environment.apiUrl, environment.publicAnonKey);
  }

  async getUser() {
    const { data, error } = await this.supabase.auth.getUser();
    if (error) {
      console.error('Error al obtener usuario:', error.message);
      return null;
    }
    return data.user;
  }

  async getMessages(): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .select('id, user_id, message, created_at')
      .order('created_at', { ascending: true });
  
    if (error || !data) {
      console.error('Error al obtener mensajes:', error?.message);
      return [];
    }
  
    // Asegúrate de obtener el nombre de usuario junto con el mensaje
    const messagesWithUsernames = await Promise.all(
      data.map(async (msg: any) => {
        const username = await this.getUserName(msg.user_id);
        return { ...msg, username };
      })
    );
  
    return messagesWithUsernames;
  }
  

  // ChatService: mantén la suscripción abierta mientras esté en uso
async onNewMessage(callback: (msg: Message) => void) {
  // Si ya existe un canal, no lo desconectes inmediatamente
  if (!this.chatChannel) {
    this.chatChannel = this.supabase
      .channel('chat-channel')
      .on<Message>('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
      }, async (payload) => {
        const newMsg = payload.new;
        const username = await this.getUserName(newMsg.user_id);

        const message: Message = {
          id: newMsg.id,
          user_id: newMsg.user_id,
          message: newMsg.message,
          created_at: newMsg.created_at,
          username
        };

        callback(message);  // Ejecuta el callback con el nuevo mensaje
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Suscripción al canal de chat activa.');
        }
      });
  }
}


async sendMessage(messageText: string, userEmail: string): Promise<void> {
  const user = await this.getUser();
  if (!user) {
    console.error('No se puede enviar el mensaje: usuario no logueado.');
    return;
  }

  const { error } = await this.supabase
    .from('chat_messages')
    .insert({
      user_id: user.id,
      message: messageText,
      created_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error al enviar mensaje:', error.message);
  } else {
    // Esto debería hacer que el mensaje aparezca inmediatamente
    console.log('Mensaje enviado correctamente');
  }
}


  async getUserName(userId: string): Promise<string> {
    const { data, error } = await this.supabase
      .from('users-data')
      .select('name')
      .eq('authId', userId)
      .single();

    if (error || !data) {
      return 'Usuario';
    }

    return data.name;
  }

  unsubscribeFromChat() {
    if (this.chatChannel) {
      this.chatChannel.unsubscribe();
      this.chatChannel = null;
    }
  }
}
