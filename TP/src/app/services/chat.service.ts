import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Subject } from 'rxjs';
import { Message } from '../models/message.interface';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private supabase: SupabaseClient;
  private messagesSubject = new Subject<Message>();

  constructor() {
    this.supabase = createClient(environment.apiUrl, environment.publicAnonKey);
  }

  // Método público para obtener el usuario
  async getUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  async getMessages(): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .select('id, user_id, message, created_at');
    
    if (error) {
      console.error('Error al obtener mensajes:', error);
      return [];
    }
  
    const messagesWithUsernames = await Promise.all(
      data.map(async (msg: any) => {
        const username = await this.getUserName(msg.user_id);
        return { ...msg, username };
      })
    );
  
    console.log('Mensajes obtenidos:', messagesWithUsernames);
    return messagesWithUsernames;
  }
  
  async onNewMessage(callback: (msg: Message) => void) {
    this.supabase
      .channel('chat-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, async (payload) => {
        const newMsg = payload.new;
        const username = await this.getUserName(newMsg['user_id']);
  
        const message: Message = {
          id: newMsg['id'],
          user_id: newMsg['user_id'],
          message: newMsg['message'],
          created_at: newMsg['created_at'],
          username
        };
  
        console.log('Nuevo mensaje:', message);
        callback(message);
      })
      .subscribe();
  }
  
  
  public async getUserName(userId: string): Promise<string> {
    const { data, error } = await this.supabase
      .from('users-data')
      .select('name')
      .eq('authId', userId)
      .single();
  
    if (error) {
      console.warn(`No se pudo obtener nombre para userId ${userId}`);
      return 'Usuario';
    }
  
    return data.name;
  }
  
}
