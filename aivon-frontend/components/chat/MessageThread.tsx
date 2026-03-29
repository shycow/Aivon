"use client";

import { useEffect, useRef, useState } from "react";
import { ChatInput } from "./ChatInput";
import { useChatStore } from "@/stores/chatStore";
import { useStream } from "@/hooks/useStream";
import { MarkdownRenderer } from "@/components/markdown/MarkdownRenderer";
import { Copy, Edit2, Trash2, Check, RefreshCw, Bookmark, ChevronDown, Search } from "lucide-react";

export function MessageThread() {
  const { messages, isGenerating, deleteMessage, toggleBookmark, activeConversationId } = useChatStore();
  const { regenerateResponse } = useStream();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const onRegenerate = async () => {
    if (activeConversationId) {
      await regenerateResponse(activeConversationId);
    }
  };

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  return (
    <div className="flex flex-col relative flex-1 h-full overflow-hidden bg-background">
      {/* Scrollable Message Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto scroll-smooth py-10 pb-40"
      >
        <div className="max-w-[720px] mx-auto px-5 space-y-10">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center pt-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="w-14 h-14 bg-foreground text-background rounded-2xl flex items-center justify-center text-2xl font-bold mb-6 shadow-lg rotate-3">
                A
              </div>
              <h1 className="text-3xl font-semibold text-text-primary mb-10 tracking-tight">
                How can I help you today?
              </h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                {[
                  "Explain quantum computing",
                  "Write a Python web scraper",
                  "Help me plan my startup",
                  "Summarize this document"
                ].map((text) => (
                  <button 
                    key={text} 
                    className="flex flex-col items-start justify-center p-4 text-sm text-text-primary border border-border-subtle rounded-xl hover:bg-bg-secondary hover:border-border-medium transition-all shadow-sm hover:shadow-md text-left"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-8">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex w-full group animate-in fade-in duration-300 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center text-[12px] font-bold mr-4 mt-1 shrink-0 shadow-sm">
                      A
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] px-5 py-4 text-[15px] leading-relaxed shadow-xs ${
                      msg.role === "user"
                        ? "bg-bg-user-bubble text-text-primary rounded-2xl rounded-br-sm"
                        : "text-text-primary whitespace-pre-wrap"
                    }`}
                  >
                    {msg.role === "assistant" && <div className="text-[14px] font-bold mb-2 tracking-tight">Aivon</div>}
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      {msg.thought && (
                        <details className="mb-4 bg-bg-tertiary/50 border border-border-subtle rounded-xl overflow-hidden group/thought transition-all">
                          <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none hover:bg-bg-tertiary list-none">
                            <div className="w-5 h-5 rounded-full bg-accent-primary/10 flex items-center justify-center">
                              <Search className="w-3 h-3 text-accent-primary" />
                            </div>
                            <span className="text-[13px] font-bold text-text-secondary">Thought Process</span>
                            <ChevronDown className="w-4 h-4 ml-auto text-text-tertiary group-open/thought:rotate-180 transition-transform" />
                          </summary>
                          <div className="px-4 pb-4 pt-1 text-[13px] text-text-tertiary italic leading-relaxed whitespace-pre-wrap border-t border-border-subtle/30 mt-1">
                            {msg.thought}
                          </div>
                        </details>
                      )}
                      
                      {msg.role === "assistant" ? (
                        msg.content.includes("**Error:**") || msg.content.includes("[GoogleGenerativeAI Error]") ? (
                          <div className="bg-accent-danger/5 border border-accent-danger/20 rounded-xl p-4 my-2">
                            <div className="flex items-center gap-2 text-accent-danger font-bold mb-2 text-[13px] uppercase tracking-wider">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                              Generation Error
                            </div>
                            <div className="text-[14px] text-text-secondary leading-relaxed error-prose">
                              <MarkdownRenderer content={msg.content.replace("**Error:**", "").trim()} />
                            </div>
                          </div>
                        ) : (
                          <MarkdownRenderer content={msg.content} />
                        )
                      ) : editingId === msg.id ? (
                        <div className="flex flex-col gap-3">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full bg-bg-tertiary border border-border-medium rounded-xl p-3 text-[15px] outline-none focus:border-border-strong min-h-[100px] resize-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 text-[12px] font-medium text-text-secondary hover:text-text-primary rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={async () => {
                                await useChatStore.getState().editMessage(msg.id, editContent);
                                setEditingId(null);
                              }}
                              className="px-3 py-1.5 text-[12px] font-medium bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity"
                            >
                              Save & Submit
                            </button>
                          </div>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                    
                    {/* Message Actions */}
                    {!editingId && (
                    <div className="flex items-center gap-4 mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <button 
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className={`flex items-center gap-1.5 text-[11px] font-bold transition-all active:scale-95 ${copiedId === msg.id ? "text-accent-primary" : "text-text-tertiary hover:text-text-primary"}`}
                      >
                        <div className={`p-1.5 rounded-lg transition-colors ${copiedId === msg.id ? "bg-accent-primary/10" : "hover:bg-bg-tertiary"}`}>
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </div>
                        <span className="w-10 overflow-hidden text-left transition-all duration-300">
                          {copiedId === msg.id ? "Copied" : "Copy"}
                        </span>
                      </button>
 
                      <button 
                        onClick={() => toggleBookmark(msg.id, !msg.isBookmarked)}
                        className={`flex items-center gap-1.5 text-[11px] font-bold transition-all active:scale-95 ${msg.isBookmarked ? "text-accent-primary" : "text-text-tertiary hover:text-text-primary"}`}
                        title={msg.isBookmarked ? "Remove bookmark" : "Bookmark message"}
                      >
                        <div className={`p-1.5 rounded-lg transition-colors ${msg.isBookmarked ? "bg-accent-primary/10" : "hover:bg-bg-tertiary"}`}>
                          <Bookmark className={`w-3.5 h-3.5 ${msg.isBookmarked ? "fill-current" : ""}`} />
                        </div>
                        <span>
                          {msg.isBookmarked ? "Bookmarked" : "Bookmark"}
                        </span>
                      </button>
                      
                      {msg.role === "user" && (
                        <>
                          <button 
                            onClick={() => {
                              setEditingId(msg.id);
                              setEditContent(msg.content);
                            }}
                            className="text-text-tertiary hover:text-accent-primary transition-colors flex items-center gap-1 text-[11px]"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button 
                            onClick={() => deleteMessage(msg.id)}
                            className="text-text-tertiary hover:text-accent-danger transition-colors flex items-center gap-1 text-[11px]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </>
                      )}
                      
                      {msg.role === "assistant" && !msg.isStreaming && (
                        <button 
                          onClick={onRegenerate}
                          className="text-text-tertiary hover:text-accent-primary transition-colors flex items-center gap-1 text-[11px]"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Regenerate
                        </button>
                      )}
                    </div>
                    )}

                    {msg.isStreaming && (
                      <div className="flex items-center gap-1 mt-2">
                        <span className="w-1.5 h-1.5 bg-accent-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-accent-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-accent-primary rounded-full animate-bounce"></span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Input Area */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <div className="bg-gradient-to-t from-background via-background/90 to-transparent pt-10 pb-6 px-5 pointer-events-auto">
          <ChatInput />
          <p className="text-[11px] text-text-tertiary text-center mt-3">
            Aivon can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </div>
  );
}
