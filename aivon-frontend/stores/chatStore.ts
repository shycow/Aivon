import { create } from "zustand";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  thought?: string;
  isStreaming?: boolean;
  isBookmarked?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  model: string;
  isPinned?: boolean;
  folderId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
}

interface ChatState {
  conversations: Conversation[];
  folders: Folder[];
  activeConversationId: string | null;
  activeModelId: string;
  messages: Message[];
  isGenerating: boolean;
  
  // Actions
  addMessage: (message: Message) => void;
  updateLastMessage: (chunk: string, isThought?: boolean) => void;
  finalizeMessage: (content: string) => void;
  setGenerating: (status: boolean) => void;
  setActiveModel: (id: string) => void;
  
  // Async Actions
  fetchConversations: () => Promise<void>;
  fetchFolders: () => Promise<void>;
  setActiveConversation: (id: string) => Promise<void>;
  createNewConversation: () => Promise<string | null>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  togglePin: (id: string, isPinned: boolean) => Promise<void>;
  moveToFolder: (id: string, folderId: string | null) => Promise<void>;
  
  // Message Actions
  deleteMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  toggleBookmark: (messageId: string, isBookmarked: boolean) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  folders: [],
  activeConversationId: null,
  activeModelId: "gemini-2.0-flash",
  messages: [],
  isGenerating: false,
  
  addMessage: (msg: Message) =>
    set((state) => ({ messages: [...state.messages, msg] })),
    
  updateLastMessage: (chunk: string, isThought?: boolean) =>
    set((state) => {
      const messages = [...state.messages];
      const lastIndex = messages.length - 1;
      if (lastIndex >= 0 && messages[lastIndex].role === "assistant") {
        if (isThought) {
          messages[lastIndex].thought = (messages[lastIndex].thought || "") + chunk;
        } else {
          messages[lastIndex].content += chunk;
        }
      }
      return { messages };
    }),
    
  finalizeMessage: (content: string) =>
    set((state) => {
      const messages = [...state.messages];
      const lastIndex = messages.length - 1;
      if (lastIndex >= 0 && messages[lastIndex].role === "assistant") {
        messages[lastIndex].content = content;
        messages[lastIndex].isStreaming = false;
      }
      return { messages, isGenerating: false };
    }),
    
  setGenerating: (status: boolean) => set({ isGenerating: status }),
  setActiveModel: (id: string) => set({ activeModelId: id }),

  fetchConversations: async () => {
    try {
      const res = await fetch("http://127.0.0.1:3001/v1/conversations");
      const data = await res.json();
      set({ conversations: Array.isArray(data) ? data : [] });
    } catch (e) { 
      console.error("Fetch convos failed", e);
      set({ conversations: [] });
    }
  },

  fetchFolders: async () => {
    try {
      const res = await fetch("http://127.0.0.1:3001/v1/folders");
      const data = await res.json();
      set({ folders: Array.isArray(data) ? data : [] });
    } catch (e) {
      console.error("Fetch folders failed", e);
    }
  },

  setActiveConversation: async (id: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:3001/v1/conversations/${id}`);
      const data = await res.json();
      set({ 
        activeConversationId: id, 
        messages: data.messages || [] 
      });
    } catch (e) { console.error("Set active failed", e); }
  },

  createNewConversation: async () => {
    try {
      const res = await fetch("http://127.0.0.1:3001/v1/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat", model: get().activeModelId })
      });
      const data = await res.json();
      set((state) => ({ 
        conversations: [data, ...state.conversations],
        activeConversationId: data.id,
        messages: []
      }));
      return data.id;
    } catch (e) { 
      console.error("Create failed", e);
      return null;
    }
  },

  deleteConversation: async (id: string) => {
    try {
      await fetch(`http://127.0.0.1:3001/v1/conversations/${id}`, { method: "DELETE" });
      set((state) => {
        const remaining = state.conversations.filter(c => c.id !== id);
        return {
          conversations: remaining,
          activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
          messages: state.activeConversationId === id ? [] : state.messages
        };
      });
    } catch (e) { console.error("Delete failed", e); }
  },

  renameConversation: async (id: string, title: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:3001/v1/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
      });
      const data = await res.json();
      set((state) => ({
        conversations: state.conversations.map(c => c.id === id ? { ...c, title: data.title } : c)
      }));
    } catch (e) { console.error("Rename failed", e); }
  },

  togglePin: async (id: string, isPinned: boolean) => {
    try {
      const res = await fetch(`http://127.0.0.1:3001/v1/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned })
      });
      const data = await res.json();
      set((state) => ({
        conversations: state.conversations.map(c => c.id === id ? { ...c, isPinned: data.isPinned } : c)
      }));
    } catch (e) { console.error("Pin failed", e); }
  },

  moveToFolder: async (id: string, folderId: string | null) => {
    try {
      const res = await fetch(`http://127.0.0.1:3001/v1/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId })
      });
      const data = await res.json();
      set((state) => ({
        conversations: state.conversations.map(c => c.id === id ? { ...c, folderId: data.folderId } : c)
      }));
    } catch (e) { console.error("Move folder failed", e); }
  },

  deleteMessage: async (messageId: string) => {
    const state = get();
    const conversationId = state.activeConversationId;
    if (!conversationId) return;

    try {
      await fetch(`http://127.0.0.1:3001/v1/messages/${conversationId}/messages/${messageId}`, {
        method: "DELETE",
      });
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== messageId),
      }));
    } catch (e) {
      console.error("Delete message failed", e);
    }
  },

  editMessage: async (messageId: string, content: string) => {
    const state = get();
    const conversationId = state.activeConversationId;
    if (!conversationId) return;

    try {
      await fetch(`http://127.0.0.1:3001/v1/messages/${conversationId}/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === messageId ? { ...m, content } : m
        ),
      }));
    } catch (e) {
      console.error("Edit message failed", e);
    }
  },

  toggleBookmark: async (messageId: string, isBookmarked: boolean) => {
    const state = get();
    const conversationId = state.activeConversationId;
    if (!conversationId) return;

    try {
      const res = await fetch(`http://127.0.0.1:3001/v1/messages/${conversationId}/messages/${messageId}/bookmark`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBookmarked }),
      });
      const data = await res.json();
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === messageId ? { ...m, isBookmarked: data.isBookmarked } : m
        ),
      }));
    } catch (e) {
      console.error("Bookmark failed", e);
    }
  },
}));
