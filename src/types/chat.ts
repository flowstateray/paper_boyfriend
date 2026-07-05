export type CharacterId = 'warm-boy' | 'cool-guy' | 'sunshine' | 'artsy';

export interface Character {
  id: CharacterId;
  name: string;
  tagline: string;
  taglineEn: string;
  tags: string[];
  avatar: string;
  speaker: string;
  systemPrompt: string;
  appearance: string;
}

export type MessageType = 'text' | 'voice' | 'image';

export interface Message {
  id: string;
  role: 'user' | 'character';
  type: MessageType;
  content: string;
  audioUri?: string;
  imageUri?: string;
  imagePrompt?: string;
  imageSource?: 'r2' | 'temporary';
  timestamp: number;
}

export interface ChatState {
  character: Character | null;
  messages: Message[];
  isTyping: boolean;
  isGeneratingImage: boolean;
}