import { useRef } from "react";
import { useChatStore } from "@/stores/chatStore";

export function useStream() {
  const { addMessage, updateLastMessage, finalizeMessage, setGenerating } = useChatStore();
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setGenerating(false);
      // Finalize with whatever we have
      const state = useChatStore.getState();
      const lastMsg = state.messages[state.messages.length - 1];
      if (lastMsg && lastMsg.role === "assistant" && lastMsg.isStreaming) {
        finalizeMessage(lastMsg.content);
      }
    }
  };

  const streamResponse = async (conversationId: string, message: string, attachments: any[] = []) => {
    // Cancel any existing stream
    stopGeneration();
    abortControllerRef.current = new AbortController();

    // Add User message immediately
    const userMsgId = crypto.randomUUID();
    addMessage({ id: userMsgId, role: "user", content: message });
    
    // Create placeholder for AI message
    const aiMsgId = crypto.randomUUID();
    addMessage({ id: aiMsgId, role: "assistant", content: "", isStreaming: true });
    setGenerating(true);

    try {
      const state = useChatStore.getState();
      const historyToSend = state.messages.filter(m => !m.isStreaming);
      const modelId = state.activeModelId;

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";
      const response = await fetch(`${API_URL}/v1/messages/${conversationId}/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historyToSend, modelId, attachments }),
        signal: abortControllerRef.current.signal
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            if (!jsonStr) continue;
            
            try {
              const data = JSON.parse(jsonStr);
              if (data.type === 'token') {
                updateLastMessage(data.content, false);
                finalContent += data.content;
              }
              if (data.type === 'error') {
                let cleanError = data.content;
                const jsonStartPattern = cleanError.indexOf('[{');
                if (jsonStartPattern !== -1 && cleanError.includes('"@type"')) {
                  cleanError = cleanError.substring(0, jsonStartPattern).trim();
                }
                updateLastMessage(cleanError, false);
                finalContent += cleanError;
              }
              if (data.type === 'thought') {
                updateLastMessage(data.content, true);
              }
              if (data.type === 'done') {
                finalizeMessage(finalContent);
                abortControllerRef.current = null;
              }
            } catch (err) {
              console.error("Parse error", jsonStr, err);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("Stream aborted");
      } else {
        console.error("Stream failed", err);
        finalizeMessage("*Generation failed.*");
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setGenerating(false);
      }
    }
  };
  
  const regenerateResponse = async (conversationId: string) => {
    stopGeneration();
    abortControllerRef.current = new AbortController();

    const state = useChatStore.getState();
    const messages = [...state.messages];
    const lastIndex = messages.findLastIndex(m => m.role === "assistant");
    if (lastIndex === -1) return;
    
    const lastUserIndex = messages.findLastIndex((m, idx) => m.role === "user" && idx < lastIndex);
    if (lastUserIndex === -1) return;
    
    useChatStore.setState({ messages: messages.slice(0, lastUserIndex + 1) });
    const assistantPlaceholderId = crypto.randomUUID();
    addMessage({ id: assistantPlaceholderId, role: "assistant", content: "", isStreaming: true });
    setGenerating(true);

    try {
      const modelId = state.activeModelId;
      const historyToSend = useChatStore.getState().messages.filter(m => !m.isStreaming);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";
      const response = await fetch(`${API_URL}/v1/messages/${conversationId}/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historyToSend, modelId }),
        signal: abortControllerRef.current.signal
      });

      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            if (!jsonStr) continue;
            try {
              const data = JSON.parse(jsonStr);
              if (data.type === 'token') {
                updateLastMessage(data.content, false);
                finalContent += data.content;
              }
              if (data.type === 'error') {
                let cleanError = data.content;
                const jsonStartPattern = cleanError.indexOf('[{');
                if (jsonStartPattern !== -1 && cleanError.includes('"@type"')) {
                  cleanError = cleanError.substring(0, jsonStartPattern).trim();
                }
                updateLastMessage(cleanError, false);
                finalContent += cleanError;
              }
              if (data.type === 'thought') {
                updateLastMessage(data.content, true);
              }
              if (data.type === 'done') {
                finalizeMessage(finalContent);
                abortControllerRef.current = null;
              }
            } catch (err) { console.error("Parse error", err); }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("Regeneration aborted");
      } else {
        console.error("Regeneration failed", err);
        finalizeMessage("*Regeneration failed.*");
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setGenerating(false);
      }
    }
  };

  return { streamResponse, regenerateResponse, stopGeneration };
}
