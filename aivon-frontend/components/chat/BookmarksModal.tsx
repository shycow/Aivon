"use client";

import { useEffect, useState } from "react";
import { X, Bookmark, Search, MessageSquare, Copy, Check, Trash2, ExternalLink } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";

export function BookmarksModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { token } = useAuthStore();
  const { setActiveConversation, toggleBookmark } = useChatStore();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && token) {
      fetchBookmarks();
    }
  }, [isOpen, token]);

  const fetchBookmarks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:3001/v1/messages/bookmarks", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setBookmarks(await res.json());
      }
    } catch (e) {
      console.error("Fetch bookmarks failed", e);
    }
    setIsLoading(false);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRemove = async (msgId: string) => {
    await toggleBookmark(msgId, false);
    setBookmarks(prev => prev.filter(b => b.id !== msgId));
  };

  const filteredBookmarks = bookmarks.filter(b => 
    b.content.toLowerCase().includes(search.toLowerCase()) || 
    b.title.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="w-full max-w-[650px] max-h-[80vh] bg-bg-primary border border-border-medium rounded-[28px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center">
              <Bookmark className="w-5 h-5 text-accent-primary fill-accent-primary/20" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary leading-none">Bookmarks</h2>
              <p className="text-xs text-text-tertiary mt-1">Saved messages across all chats</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-text-tertiary" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 bg-bg-secondary/30">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input 
              type="text" 
              placeholder="Search in bookmarks..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 bg-bg-primary border border-border-subtle rounded-xl pl-10 pr-4 text-sm focus:outline-none focus:border-border-strong transition-all"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 thin-scrollbar">
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <div className="w-8 h-8 border-3 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin"></div>
            </div>
          ) : filteredBookmarks.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-border-medium rounded-2xl bg-bg-secondary/20">
              <Bookmark className="w-10 h-10 text-text-tertiary mx-auto mb-3 opacity-20" />
              <p className="text-sm text-text-tertiary">No bookmarks found</p>
            </div>
          ) : (
            filteredBookmarks.map((bookmark) => (
              <div 
                key={bookmark.id}
                className="group p-5 bg-bg-secondary/40 border border-border-subtle rounded-2xl hover:border-border-medium hover:bg-bg-secondary/60 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-accent-primary opacity-60" />
                    <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">{bookmark.title}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleCopy(bookmark.id, bookmark.content)}
                      className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-primary rounded-md transition-all"
                      title="Copy"
                    >
                      {copiedId === bookmark.id ? <Check className="w-3.5 h-3.5 text-accent-primary" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button 
                      onClick={() => {
                        setActiveConversation(bookmark.conversationId);
                        onClose();
                      }}
                      className="p-1.5 text-text-tertiary hover:text-accent-primary hover:bg-bg-primary rounded-md transition-all"
                      title="View in Chat"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleRemove(bookmark.id)}
                      className="p-1.5 text-text-tertiary hover:text-accent-danger hover:bg-bg-primary rounded-md transition-all"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-[14px] text-text-primary leading-relaxed line-clamp-4 whitespace-pre-wrap font-medium">
                  {bookmark.content}
                </div>
                <div className="mt-3 pt-3 border-t border-border-subtle/30 flex items-center justify-between">
                  <span className="text-[10px] text-text-tertiary">{new Date(bookmark.createdAt).toLocaleDateString()}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${bookmark.role === 'assistant' ? 'bg-foreground text-background' : 'bg-bg-tertiary text-text-secondary'}`}>
                    {bookmark.role?.toUpperCase()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-bg-secondary/30 border-t border-border-subtle flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-foreground text-background hover:opacity-90 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-98"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
