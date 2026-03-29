"use client";

import { useEffect, useState } from "react";
import { X, User, CreditCard, Key, Shield, LogOut, Upload, Check, Zap, Plus, Trash2 as TrashIcon, Copy, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, token, logout, setAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");
  const [name, setName] = useState(user?.name || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const fileInputRef = (require('react') as any).useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setIsUploadingAvatar(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:3001/v1/auth/avatar", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const { avatarUrl } = await res.json();
        setAuth({ ...user!, avatarUrl }, token);
      }
    } catch (e) {}
    setIsUploadingAvatar(false);
  };
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && token) {
      fetchUser();
      if (activeTab === "api") fetchApiKeys();
    }
  }, [isOpen, activeTab, token]);

  const fetchUser = async () => {
    try {
      const res = await fetch("http://127.0.0.1:3001/v1/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAuth(data, token!);
      }
    } catch (e) {}
  };

  const fetchApiKeys = async () => {
    setIsLoadingKeys(true);
    try {
      const res = await fetch("http://127.0.0.1:3001/v1/api-keys", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setApiKeys(await res.json());
    } catch (e) {}
    setIsLoadingKeys(false);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("http://127.0.0.1:3001/v1/auth/me", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        const updated = await res.json();
        setAuth(updated, token!);
      }
    } catch (e) {}
    setIsSaving(false);
  };

  const handleCreateKey = async () => {
    try {
      const res = await fetch("http://127.0.0.1:3001/v1/api-keys", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: "New API Key" })
      });
      if (res.ok) fetchApiKeys();
    } catch (e) {}
  };

  const handleDeleteKey = async (id: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:3001/v1/api-keys/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) fetchApiKeys();
    } catch (e) {}
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!isOpen) return null;

  const tabs = [
    { id: "profile", name: "Profile", icon: User },
    { id: "billing", name: "Billing", icon: CreditCard },
    { id: "api", name: "API Access", icon: Key },
    { id: "security", name: "Security", icon: Shield },
  ];

  const totalTokens = 5000;
  const tokensUsed = user?.tokensUsed || 0;
  const progress = Math.min((tokensUsed / totalTokens) * 100, 100);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="w-full max-w-[800px] h-[580px] bg-bg-primary border border-border-medium rounded-[32px] shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-300 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar */}
        <div className="w-64 border-r border-border-subtle bg-bg-secondary/50 p-6 flex flex-col">
          <h2 className="text-xl font-bold text-text-primary mb-8 px-2 tracking-tight">Settings</h2>
          
          <div className="flex-1 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-semibold ${activeTab === tab.id ? "bg-bg-primary text-accent-primary shadow-sm border border-border-subtle" : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"}`}
              >
                <tab.icon className="w-[18px] h-[18px]" />
                {tab.name}
              </button>
            ))}
          </div>

          <button 
            onClick={() => { logout(); onClose(); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-tertiary hover:text-accent-danger hover:bg-accent-danger/10 transition-all text-sm font-semibold mt-auto"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Log out
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col bg-bg-primary overflow-hidden">
          <div className="p-8 flex-1 overflow-y-auto">
            {activeTab === "profile" && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-lg font-bold text-text-primary mb-6">Profile Settings</h3>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-6 pb-6 border-b border-border-subtle">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-accent-primary/40 to-accent-primary/80 flex items-center justify-center text-3xl font-bold text-white shadow-lg border border-white/20 overflow-hidden relative group">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name || "User"} className="w-full h-full object-cover" />
                      ) : (
                        user?.name?.[0] || user?.email?.[0].toUpperCase()
                      )}
                      {isUploadingAvatar && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    <div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleAvatarUpload}
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-xl text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {isUploadingAvatar ? "Uploading..." : "Change Avatar"}
                      </button>
                      <p className="text-[11px] text-text-tertiary mt-2">JPG, PNG or GIF. Max size 2MB.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider ml-1">Full Name</label>
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-border-strong transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider ml-1">Email Address</label>
                      <input 
                        type="email" 
                        value={user?.email || ""}
                        disabled
                        className="w-full bg-bg-tertiary/50 border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-tertiary cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                     <button 
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="px-6 py-2.5 bg-foreground text-background rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2"
                     >
                      {isSaving ? "Saving..." : "Save Changes"}
                      {isSaving && <div className="w-3.5 h-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin"></div>}
                     </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "billing" && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-lg font-bold text-text-primary mb-1">Billing & Subscription</h3>
                <p className="text-sm text-text-tertiary mb-6">Manage your plan and payment methods.</p>

                <div className="bg-bg-tertiary/50 border border-border-medium rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-text-primary px-2 py-0.5 bg-accent-primary/10 text-accent-primary rounded-md uppercase tracking-tight text-[10px]">Current Plan</span>
                        <h4 className="text-2xl font-black text-text-primary tracking-tight">{user?.plan === 'pro' ? 'Pro Tier' : 'Free Tier'}</h4>
                      </div>
                      <p className="text-xs text-text-tertiary mt-1">
                        {user?.plan === 'pro' ? 'Unlimited access to all Omega models.' : 'Great for personal use and simple tasks.'}
                      </p>
                    </div>
                    {user?.plan !== 'pro' && (
                      <button className="px-6 py-3 bg-accent-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-accent-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                        <Zap className="w-4 h-4 fill-current" />
                        Upgrade to Pro
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border-subtle/30">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Usage this month</span>
                      <div className="flex items-end gap-2 mt-1">
                        <span className="text-xl font-bold text-text-primary tracking-tight">{tokensUsed.toLocaleString()} / {totalTokens.toLocaleString()}</span>
                        <span className="text-xs text-text-tertiary mb-0.5">tokens</span>
                      </div>
                      <div className="w-full h-1.5 bg-bg-tertiary rounded-full mt-2 overflow-hidden">
                        <div 
                          className="h-full bg-accent-primary rounded-full transition-all duration-500" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Next reset</span>
                      <span className="text-sm font-bold text-text-primary mt-1">April 1st, 2026</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                   <h4 className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest ml-1">Payment Method</h4>
                   <div className="flex items-center justify-between p-4 border border-border-subtle rounded-xl bg-bg-tertiary/30">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-6 bg-slate-100 rounded border border-slate-200 flex items-center justify-center overflow-hidden">
                         <span className="text-[8px] font-black italic text-blue-800">VISA</span>
                       </div>
                       <span className="text-sm font-medium text-text-primary">Visa ending in •••• 4242</span>
                     </div>
                     <button className="text-xs font-bold text-accent-primary hover:underline">Edit</button>
                   </div>
                </div>
              </div>
            )}

            {activeTab === "api" && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-bold text-text-primary">API Access</h3>
                  <button 
                    onClick={handleCreateKey}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-primary/10 text-accent-primary rounded-lg text-[11px] font-bold hover:bg-accent-primary/20 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create New Key
                  </button>
                </div>
                <p className="text-sm text-text-tertiary mb-8">Access the Omega platform power through our developer API.</p>

                <div className="space-y-4">
                  {isLoadingKeys ? (
                    <div className="py-12 flex justify-center">
                      <div className="w-6 h-6 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin"></div>
                    </div>
                  ) : apiKeys.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-border-medium rounded-2xl bg-bg-secondary/20">
                      <p className="text-sm text-text-tertiary">No API keys generated yet.</p>
                    </div>
                  ) : (
                    apiKeys.map((key) => (
                      <div key={key.id} className="p-4 bg-bg-tertiary/30 border border-border-subtle rounded-2xl flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-text-primary">{key.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-text-tertiary italic">Last used: {key.lastUsedAt || 'Never'}</span>
                            <button 
                              onClick={() => handleDeleteKey(key.id)}
                              className="p-1.5 text-text-tertiary hover:text-accent-danger transition-colors"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <input 
                            type="password" 
                            value={key.key}
                            readOnly
                            className="flex-1 bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-2.5 text-xs font-mono text-text-secondary focus:outline-none"
                          />
                          <button 
                            onClick={() => copyToClipboard(key.key)}
                            className="px-4 bg-foreground text-background font-bold text-[10px] rounded-xl hover:opacity-90 transition-all flex items-center gap-2"
                          >
                            {copiedKey === key.key ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copiedKey === key.key ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}

                  <div className="p-5 border border-dashed border-border-medium rounded-2xl bg-bg-secondary/30 mt-6">
                    <h5 className="text-[12px] font-bold text-text-primary mb-2">Documentation</h5>
                    <p className="text-xs text-text-tertiary leading-relaxed mb-4">Integrate Aivon Omega into your own applications with just a few lines of code. Support for Python, Node.js and REST.</p>
                    <button className="text-xs font-bold text-accent-primary flex items-center gap-1.5 hover:underline">
                      View API Reference
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-bg-secondary/30 border-t border-border-subtle flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 bg-bg-tertiary hover:bg-bg-secondary text-text-primary rounded-xl text-sm font-bold transition-all shadow-xs"
            >
              Done
            </button>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary rounded-full transition-all md:hidden"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
