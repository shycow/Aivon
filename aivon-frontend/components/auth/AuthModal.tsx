"use client";

import { useState } from "react";
import { X, Mail, Lock, User, ArrowRight, Github, Chrome } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";

export function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setAuth } = useAuthStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const endpoint = isLogin ? "/login" : "/signup";
    const body = isLogin ? { email, password } : { email, password, name };

    try {
      const res = await fetch(`${API_URL}/v1/auth${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        setAuth(data.user, data.token);
        onClose();
      } else {
        setError(data.error || "Authentication failed");
      }
    } catch (err) {
      setError("Network error. Is the backend running?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-[420px] bg-bg-primary border border-border-medium rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary rounded-full transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 pt-12">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-12 h-12 bg-foreground text-background rounded-2xl flex items-center justify-center text-xl font-bold mb-4 shadow-lg rotate-3">
              A
            </div>
            <h2 className="text-2xl font-bold text-text-primary tracking-tight">
              {isLogin ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-sm text-text-tertiary mt-2">
              {isLogin ? "Sign in to Aivon Omega to continue" : "Join the future of intelligence today"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-subtle rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-border-strong transition-all"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-bg-tertiary border border-border-subtle rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-border-strong transition-all"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-bg-tertiary border border-border-subtle rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-border-strong transition-all"
                required
              />
            </div>

            {error && <div className="text-xs text-accent-danger bg-accent-danger/10 p-3 rounded-lg border border-accent-danger/20 font-medium">{error}</div>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-foreground text-background font-bold py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin"></div>
              ) : (
                <>
                  {isLogin ? "Sign In" : "Get Started"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-subtle"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
              <span className="bg-bg-primary px-3 text-text-tertiary">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => window.location.href = "${API_URL}/v1/auth/google"}
              className="flex items-center justify-center gap-2 py-2.5 border border-border-subtle rounded-xl hover:bg-bg-tertiary transition-all text-xs font-semibold"
            >
              <Chrome className="w-4 h-4" />
              Google
            </button>
            <button 
              onClick={() => window.location.href = "${API_URL}/v1/auth/github"}
              className="flex items-center justify-center gap-2 py-2.5 border border-border-subtle rounded-xl hover:bg-bg-tertiary transition-all text-xs font-semibold"
            >
              <Github className="w-4 h-4" />
              GitHub
            </button>
          </div>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-text-tertiary hover:text-text-primary transition-colors font-medium"
            >
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span className="text-accent-primary font-bold">{isLogin ? "Create account" : "Log in"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
