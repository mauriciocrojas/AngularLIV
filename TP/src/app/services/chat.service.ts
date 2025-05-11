import { Injectable } from '@angular/core';
import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Message } from '../models/message.interface'; // ✅ Usar modelo unificado

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private supabase: SupabaseClient;
  private channel: RealtimeChannel | null = null;

  constructor(private auth: AuthService) { 
    this.supabase = auth.getClient();
  }

  async fetchMessages(): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .select(`
        id,
        message,
        created_at,
        user_id,
        "users-data"(name)
      `)
      .order('created_at', { ascending: true });
  
    if (error) {
      console.error('Error fetching messages:', error);  // Mostrar todo el error para detalles
      return [];
    }
  
    console.log('Fetched data:', data);  // Verificar si los datos son correctos
  
    // Si no hay datos, retornar un array vacío
    if (!data) {
      console.error('No data returned from the query');
      return [];
    }
  
    // Mapeamos los datos para que coincidan con la interfaz Message
    const messages: Message[] = data.map(item => ({
      id: item.id,  // Usamos 'id' de la tabla 'chat_messages'
      message: item.message,
      created_at: item.created_at,
      user_id: item.user_id,
      username: item['users-data'] && item['users-data'].length > 0 ? item['users-data'][0].name : 'Unknown',  // Accedemos al 'name' de 'users-data'
    }));
  
    return messages;
  }
  
  
  
  
  
  
  
  
  
  

  async sendMessage(content: string): Promise<boolean> {
    const { user } = await this.auth.getUser();  // Obtiene el usuario autenticado
  
    if (!user) {
      console.error('No authenticated user');
      return false;
    }
  
    const userId = user.id;  // Asegúrate de que 'user.id' sea el ID del usuario autenticado
  
    const { error } = await this.supabase.from('chat_messages').insert([{
      message: content.trim(),
      user_id: userId,  // Asociamos el mensaje con el user_id
    }]);
  
    if (error) {
      console.error('Error sending message:', error.message);
      return false;
    }
  
    return true;
  }
  
  

  subscribeToMessages(onNewMessage: (msg: Message) => void): RealtimeChannel {
    this.channel = this.supabase.channel('messages-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        const newMessage = payload.new as Message;
        onNewMessage(newMessage);
      })
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return this.channel;
  }

  removeSubscription(): void {
    if (this.channel) {
      this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}
