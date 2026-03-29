"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: wire up to backend API endpoint
    console.log("Login submitted", { email, password });
    setTimeout(() => {
      setLoading(false);
      window.location.href = "/";
    }, 1000);
  };

  return (
    <Card className="w-full max-w-[440px] border-border-medium rounded-[16px] shadow-lg py-4">
      <CardHeader className="text-center pb-8 space-y-4">
        <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-[8px] bg-foreground text-background font-bold select-none">
          A
        </div>
        <div>
          <CardTitle className="text-[22px] font-semibold tracking-tight text-text-primary">
            Welcome back
          </CardTitle>
          <CardDescription className="text-sm text-text-secondary mt-1">
            Sign in to continue to Aivon.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-text-primary px-1">
                Email address
              </label>
              <Input
                type="email"
                placeholder="yours@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <label className="text-[13px] font-medium text-text-primary">
                  Password
                </label>
                <a href="/forgot-password" className="text-[13px] text-text-link hover:underline">
                  Forgot password?
                </a>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </div>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col items-center border-t border-border-subtle pt-6 pb-2 space-y-4">
        <div className="text-[14px] text-text-secondary">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="text-text-primary font-medium hover:underline">
            Sign up
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
