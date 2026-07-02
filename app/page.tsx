'use client';

import CharacterSelect from "@/components/CharacterSelect";
import ChatScreen from "@/components/ChatScreen";
import { useChat } from "@/context/ChatContext";

export default function Home() {
  const { chatState } = useChat();

  if (chatState.character) {
    return <ChatScreen />;
  }

  return <CharacterSelect />;
}