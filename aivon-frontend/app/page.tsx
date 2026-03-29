"use client";

import { ChatShell } from "@/components/chat/ChatShell";
import { Sidebar } from "@/components/chat/Sidebar";
import { MessageThread } from "@/components/chat/MessageThread";

export default function Home() {
  return (
    <ChatShell>
      <Sidebar />
      <MessageThread />
    </ChatShell>
  );
}
