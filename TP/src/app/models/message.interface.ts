export interface Message {
  id?: string;
  userId: string;
  username?: string;  // nuevo campo
  text: string;
  timestamp: string;
}
