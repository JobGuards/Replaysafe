"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, Loader2, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4040";
      const response = await fetch(`${apiBase}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
        credentials: "include",
      });

      if (response.ok) {
        window.location.href = "/dashboard";
      } else {
        const data = await response.json();
        setError(data.error || "Registration failed");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setError("Connection failed. Please check your internet.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel w-full border border-border/10 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-acid-lime to-transparent"></div>

      <div className="mb-8">
        <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">
          Get Started
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Start monitoring your heartbeats in minutes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <p className="text-xs font-bold text-destructive italic uppercase tracking-wider">
              {error}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="fullName"
              className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1"
            >
              Full Name
            </Label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-acid-lime transition-colors" />
              <Input
                id="fullName"
                type="text"
                placeholder="Alex Sentinel"
                className="h-14 pl-12 bg-background/50 border-border/20 focus:border-acid-lime/50 rounded-xl transition-all font-medium"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1"
            >
              Work Email
            </Label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-acid-lime transition-colors" />
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                className="h-14 pl-12 bg-background/50 border-border/20 focus:border-acid-lime/50 rounded-xl transition-all font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1"
            >
              Password
            </Label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-acid-lime transition-colors" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-14 pl-12 bg-background/50 border-border/20 focus:border-acid-lime/50 rounded-xl transition-all font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <Button
          className="w-full h-14 bg-acid-lime text-primary-foreground hover:opacity-90 rounded-xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(var(--theme-lime-rgb),0.2)] hover:shadow-[0_0_35px_rgba(var(--theme-lime-rgb),0.4)] transition-all flex items-center justify-center gap-2 group"
          type="submit"
          disabled={isLoading || !email}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Create Account
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </>
          )}
        </Button>

        <div className="pt-4 border-t border-border/10">
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/auth/signin"
              className="text-foreground font-bold hover:text-acid-lime transition-colors underline underline-offset-4 decoration-acid-lime/30"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
