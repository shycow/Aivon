import { useEffect, useState } from "react";
import { PlusCircle, Search, Settings, MessageSquare, Trash2, Edit2, Pin, Folder, ChevronRight, ChevronDown, LogIn, LogOut, Bookmark } from "lucide-react";
import { useChatStore, Conversation } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import { AuthModal } from "@/components/auth/AuthModal";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { BookmarksModal } from "@/components/chat/BookmarksModal";

export function Sidebar() {
  const { 
    conversations, 
    folders,
    activeConversationId, 
    fetchConversations, 
    fetchFolders,
    setActiveConversation, 
    createNewConversation,
    deleteConversation,
    renameConversation,
    togglePin
  } = useChatStore();

  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBookmarksModal, setShowBookmarksModal] = useState(false);

  useEffect(() => {
    fetchConversations();
    fetchFolders();
    checkAuth();
  }, [fetchConversations, fetchFolders, checkAuth]);

  const [search, setSearch] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const safeConversations = Array.isArray(conversations) ? conversations : [];
  const safeFolders = Array.isArray(folders) ? folders : [];

  const filteredConversations = safeConversations.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter(c => c.isPinned);
  const unpinnedConversations = filteredConversations.filter(c => !c.isPinned);

  // Group unpinned conversations by folder
  const conversationsInFolders: Record<string, Conversation[]> = {};
  const rootConversations: Conversation[] = [];

  unpinnedConversations.forEach(c => {
    if (c.folderId) {
      if (!conversationsInFolders[c.folderId]) conversationsInFolders[c.folderId] = [];
      conversationsInFolders[c.folderId].push(c);
    } else {
      rootConversations.push(c);
    }
  });

  return (
    <aside className="w-[260px] h-full flex flex-col bg-bg-secondary border-r border-border-subtle shrink-0 max-md:hidden">
      {/* Top Section */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between h-9">
          <div className="flex items-center gap-2 font-semibold text-text-primary">
            <div className="w-5 h-5 bg-foreground rounded-[4px]"></div>
            Aivon 
            <span className="text-[10px] bg-accent-primary/10 text-accent-primary px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Omega</span>
          </div>
        </div>

        <button 
          onClick={() => createNewConversation()}
          className="flex items-center gap-2 w-full h-10 px-3 border border-border-medium rounded-xl hover:bg-bg-tertiary transition-all text-sm font-medium text-text-primary bg-bg-primary shadow-xs hover:shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          New chat
        </button>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input 
            type="text" 
            placeholder="Search chats..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 bg-bg-primary border border-border-subtle rounded-xl pl-9 pr-3 text-[13px] placeholder:text-text-tertiary focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-border-strong transition-all"
          />
        </div>
      </div>

      {/* Conversation List (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-2 py-2 thin-scrollbar space-y-4">
        
        {/* Pinned Section */}
        {pinnedConversations.length > 0 && (
          <div>
            <div className="text-[11px] font-bold text-text-tertiary uppercase px-3 mb-2 tracking-widest flex items-center gap-1.5">
              <Pin className="w-3 h-3 rotate-45" />
              Pinned
            </div>
            <div className="flex flex-col gap-0.5">
              {pinnedConversations.map((conv: Conversation) => (
                <ConversationItem 
                  key={conv.id} 
                  conv={conv} 
                  activeId={activeConversationId}
                  onSelect={setActiveConversation}
                  onRename={renameConversation}
                  onDelete={deleteConversation}
                  onTogglePin={togglePin}
                />
              ))}
            </div>
          </div>
        )}

        {/* Folders Section */}
        {safeFolders.length > 0 && (
          <div>
            <div className="text-[11px] font-bold text-text-tertiary uppercase px-3 mb-2 tracking-widest flex items-center gap-1.5">
              <Folder className="w-3 h-3" />
              Folders
            </div>
            <div className="flex flex-col gap-1">
              {safeFolders.map(folder => (
                <div key={folder.id} className="flex flex-col">
                  <button 
                    onClick={() => toggleFolder(folder.id)}
                    className="flex items-center gap-2 w-full h-9 px-3 rounded-lg hover:bg-bg-tertiary/50 transition-colors text-sm text-text-secondary font-medium"
                  >
                    {expandedFolders[folder.id] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    <Folder className="w-3.5 h-3.5 opacity-60" />
                    <span className="truncate">{folder.name}</span>
                  </button>
                  {expandedFolders[folder.id] && (
                    <div className="flex flex-col gap-0.5 pl-4 mt-0.5 ml-3 border-l border-border-subtle">
                      {(conversationsInFolders[folder.id] || []).map((conv: Conversation) => (
                        <ConversationItem 
                          key={conv.id} 
                          conv={conv} 
                          activeId={activeConversationId}
                          onSelect={setActiveConversation}
                          onRename={renameConversation}
                          onDelete={deleteConversation}
                          onTogglePin={togglePin}
                        />
                      ))}
                      {(!conversationsInFolders[folder.id] || conversationsInFolders[folder.id].length === 0) && (
                        <div className="py-2 px-3 text-[11px] text-text-tertiary italic">Empty folder</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Recent / Root Section */}
        <div>
          <div className="text-[11px] font-bold text-text-tertiary uppercase px-3 mb-2 tracking-widest flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3" />
            Recent
          </div>
          <div className="flex flex-col gap-0.5">
            {rootConversations.map((conv: Conversation) => (
              <ConversationItem 
                key={conv.id} 
                conv={conv} 
                activeId={activeConversationId}
                onSelect={setActiveConversation}
                onRename={renameConversation}
                onDelete={deleteConversation}
                onTogglePin={togglePin}
              />
            ))}
          </div>
        </div>

        {filteredConversations.length === 0 && search && (
          <div className="px-4 py-8 text-center text-xs text-text-tertiary italic">
            No conversations found for "{search}"
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border-subtle flex flex-col gap-1">
        <button 
          onClick={() => setShowBookmarksModal(true)}
          className="flex items-center gap-3 w-full h-10 px-3 rounded-xl hover:bg-bg-tertiary transition-colors text-sm text-text-secondary"
        >
          <Bookmark className="w-[18px] h-[18px]" />
          Bookmarks
        </button>

        <button 
          onClick={() => setShowSettingsModal(true)}
          className="flex items-center gap-3 w-full h-10 px-3 rounded-xl hover:bg-bg-tertiary transition-colors text-sm text-text-secondary"
        >
          <Settings className="w-[18px] h-[18px]" />
          Settings
        </button>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 w-full h-[52px] px-3 rounded-xl hover:bg-bg-tertiary/30 transition-colors text-sm text-text-primary mt-1 relative group/profile">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-primary/40 to-accent-primary/80 shrink-0 shadow-xs border border-white/20 flex items-center justify-center font-bold text-xs text-white overflow-hidden">
              {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : user.name?.[0] || user.email[0].toUpperCase()}
            </div>
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="font-semibold truncate">{user.name || "User"}</span>
              <span className="text-[11px] text-text-tertiary truncate leading-none mt-0.5">{user.email}</span>
            </div>
            <button 
              onClick={() => logout()}
              className="absolute right-3 opacity-0 group-hover/profile:opacity-100 p-1.5 hover:text-accent-danger transition-all hover:bg-bg-primary rounded-md"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-3 w-full h-11 px-3 rounded-xl bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 transition-all text-sm font-bold mt-1"
          >
            <LogIn className="w-[18px] h-[18px]" />
            Sign in to Omega
          </button>
        )}
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
    </aside>
  );
}

function ConversationItem({ conv, activeId, onSelect, onRename, onDelete, onTogglePin }: any) {
  return (
    <div 
      className={`group flex items-center gap-2 w-full h-10 px-2 rounded-xl transition-all cursor-pointer relative ${
        activeId === conv.id 
          ? "bg-bg-tertiary text-text-primary shadow-xs" 
          : "text-text-secondary hover:bg-bg-tertiary/50 hover:text-text-primary"
      }`}
      onClick={() => onSelect(conv.id)}
    >
      <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
      <span className="flex-1 truncate text-sm font-medium pr-8">{conv.title}</span>
      
      {/* Action Icons (Visible on hover) */}
      <div className="absolute right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(conv.id, !conv.isPinned);
          }}
          className={`p-1 transition-colors hover:bg-bg-primary rounded-md ${conv.isPinned ? "text-accent-primary" : "text-text-tertiary hover:text-accent-primary"}`}
          title={conv.isPinned ? "Unpin" : "Pin"}
        >
          <Pin className={`w-3 h-3 ${conv.isPinned ? "fill-current" : ""}`} />
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            const newTitle = prompt("Enter new title:", conv.title);
            if (newTitle) onRename(conv.id, newTitle);
          }}
          className="p-1 text-text-tertiary hover:text-accent-primary transition-colors hover:bg-bg-primary rounded-md"
          title="Rename"
        >
          <Edit2 className="w-3 h-3" />
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Delete this conversation?")) onDelete(conv.id);
          }}
          className="p-1 text-text-tertiary hover:text-accent-danger transition-colors hover:bg-bg-primary rounded-md"
          title="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
