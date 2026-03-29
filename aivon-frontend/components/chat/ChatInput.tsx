"use client";

import { useEffect, useRef, useState } from "react";
import { Paperclip, Image as ImageIcon, Search, Code, Mic, X, Brain, Globe, ArrowUp } from "lucide-react";
import { useChatStore } from "@/stores/chatStore";
import { useStream } from "@/hooks/useStream";
import { useAuthStore } from "@/stores/authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";

export function ChatInput() {
  const { user } = useAuthStore();
  const [message, setMessage] = useState("");
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeepThinking, setIsDeepThinking] = useState(false);
  const [isWebSearch, setIsWebSearch] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize logic (min 1 row, max 8 rows per OMEGA spec)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;
    textarea.style.height = `${Math.min(Math.max(scrollHeight, 44), 220)}px`;
  }, [message]);

  const { streamResponse, stopGeneration } = useStream();
  const { isGenerating, activeConversationId, createNewConversation, activeModelId, setActiveModel } = useChatStore();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    const newFiles = [...files];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(`${API_URL}/v1/uploads`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        newFiles.push({ ...data, isImage: file.type.startsWith("image/") });
      } catch (err) {
        console.error("Upload failed", err);
      }
    }

    setFiles(newFiles);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((message.trim() || files.length > 0) && !isGenerating) {
      let conversationId = activeConversationId;
      if (!conversationId) {
        conversationId = await createNewConversation();
      }
      if (conversationId) {
        let finalMessage = message.trim();
        
        // Add flags to message for backend processing (Mock implementation)
        const flags = [];
        if (isDeepThinking) flags.push("[DEEP THINKING]");
        if (isWebSearch) flags.push("[WEB SEARCH]");
        if (files.length > 0) flags.push(`[ATTACHMENTS: ${files.map(f => f.filename).join(", ")}]`);
        
        if (flags.length > 0) {
          finalMessage = flags.join(" ") + "\n\n" + finalMessage;
        }

        streamResponse(conversationId, finalMessage, files);
        
        setMessage("");
        setFiles([]);
        setIsDeepThinking(false);
        setIsWebSearch(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const models = [
    { id: "gemini-3.0-flash", name: "Gemini 3.0", desc: "Next-gen intelligence & speed" },
    { id: "gemini-2.5-flash", name: "Flash 2.5", desc: "Advanced multimodal reasoning" },
    { id: "gemini-2.5-pro", name: "Pro 2.5", desc: "Complex logic & coding" },
    { id: "gemini-2.0-flash", name: "Standard", desc: "Fast & efficient (Flash 2.0)" },
    { id: "gemini-2.0-flash-thinking-exp", name: "Thinking", desc: "Deep analysis & research" }
  ];

  return (
    <div className="w-full max-w-[720px] mx-auto px-5">
      <div className="relative flex flex-col w-full bg-bg-input border border-border-medium rounded-2xl shadow-md focus-within:border-border-strong focus-within:ring-2 focus-within:ring-border-subtle transition-all group">
        
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple
          onChange={handleFileUpload} 
        />

        {/* Model Selector Overlay */}
        {showModelSelector && (
          <div className="absolute top-12 left-4 z-20 w-64 bg-bg-primary border border-border-medium rounded-xl shadow-xl p-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="text-[11px] font-bold text-text-tertiary px-3 py-1 uppercase tracking-wider mb-1">Select Model</div>
            {models.map(m => (
              <button
                key={m.id}
                onClick={() => { setActiveModel(m.id); setShowModelSelector(false); }}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex flex-col gap-0.5 ${activeModelId === m.id ? "bg-bg-tertiary" : "hover:bg-bg-tertiary/50"}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[13px] font-semibold ${activeModelId === m.id ? "text-accent-primary" : "text-text-primary"}`}>{m.name}</span>
                  {activeModelId === m.id && <div className="w-1.5 h-1.5 bg-accent-primary rounded-full"></div>}
                </div>
                <span className="text-[11px] text-text-tertiary leading-none">{m.desc}</span>
              </button>
            ))}
          </div>
        )}

        {/* Attachment Toolbar (Top row) */}
        <div className="flex items-center gap-1 px-3 pt-3">
          <button 
            onClick={() => setShowModelSelector(!showModelSelector)}
            className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary rounded-md transition-colors uppercase tracking-tight"
          >
            {models.find(m => m.id === activeModelId)?.name || "Standard"}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          
          <div className="w-[1px] h-4 bg-border-subtle mx-1"></div>
          
          <button 
            onClick={() => setIsDeepThinking(!isDeepThinking)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${isDeepThinking ? "bg-accent-primary/10 text-accent-primary shadow-sm" : "text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary"}`}
            title="Deep Thinking Mode (o1 style)"
          >
            <Brain className="w-3.5 h-3.5" />
            Thinking
          </button>

          <button 
            onClick={() => setIsWebSearch(!isWebSearch)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${isWebSearch ? "bg-accent-primary/10 text-accent-primary shadow-sm" : "text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary"}`}
            title="Real-time Web Search"
          >
            <Globe className="w-3.5 h-3.5" />
            Search
          </button>

          <div className="w-[1px] h-4 bg-border-subtle mx-1"></div>
          
          <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary rounded-md transition-colors" title="Attach file">
            <Paperclip className="w-4 h-4" />
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary rounded-md transition-colors" title="Add image">
            <ImageIcon className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary rounded-md transition-colors" title="Web search">
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* File Preview Area */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pt-2">
            {files.map((f, i) => (
              <div key={i} className="relative group/file w-14 h-14 rounded-lg border border-border-subtle bg-bg-tertiary overflow-hidden">
                {f.isImage ? (
                  <img src={f.url} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-text-tertiary text-center p-1 break-all">
                    {f.filename.split('.').pop()?.toUpperCase()}
                  </div>
                )}
                <button 
                  onClick={() => removeFile(i)}
                  className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover/file:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {isUploading && <div className="w-8 h-14 flex items-center justify-center"><div className="w-4 h-4 border-2 border-accent-primary border-t-transparent rounded-full animate-spin"></div></div>}
          </div>
        )}

        {/* Textarea Area */}
        <div className="flex px-4 py-2 gap-3 items-start">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-primary/40 to-accent-primary/80 shrink-0 shadow-xs border border-white/20 flex items-center justify-center font-bold text-[10px] text-white overflow-hidden mt-1.5 grayscale-[0.5] opacity-80 group-focus-within:grayscale-0 group-focus-within:opacity-100 transition-all">
            {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : user?.name?.[0] || user?.email?.[0].toUpperCase() || "U"}
          </div>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Aivon..."
            className="w-full resize-none bg-transparent border-none outline-none text-[15px] leading-[1.6] text-text-primary placeholder:text-text-tertiary py-2 overflow-y-auto"
            rows={1}
          />
        </div>

        {/* Bottom Row */}
        <div className="flex items-center justify-between px-3 pb-3">
          <div className="flex items-center text-xs text-text-tertiary px-1">
            {message.length > 500 && <span>{message.length} characters</span>}
          </div>

          <div className="flex items-center gap-1">
            <button className="text-text-secondary hover:text-text-primary p-2 hover:bg-bg-tertiary rounded-full transition-colors">
              <Mic className="w-4 h-4" />
            </button>
            {isGenerating ? (
              <button
                onClick={stopGeneration}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-danger text-white hover:scale-105 active:scale-95 shadow-md transition-all"
                title="Stop generation"
              >
                <div className="w-2.5 h-2.5 bg-current rounded-[2px]" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!message.trim() && files.length === 0}
                className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${
                  message.trim() || files.length > 0
                    ? "bg-foreground text-background hover:scale-105 active:scale-95 shadow-md" 
                    : "bg-bg-tertiary text-text-tertiary cursor-not-allowed"
                }`}
              >
                <ArrowUp className={`w-4 h-4 stroke-[3] transition-transform ${message.trim() ? "translate-y-0" : "translate-y-0.5"}`} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
