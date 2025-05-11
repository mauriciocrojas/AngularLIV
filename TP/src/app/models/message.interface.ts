export interface Message {
  id: string; // O 'number', dependiendo de tu base de datos
  message: string;
  created_at: string;
  user_id: string;
  username: string;
}
