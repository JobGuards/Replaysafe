"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Check, Loader2, ArrowRight } from "lucide-react";

export function InterestForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setMessage("Please enter a valid email address.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    try {
      await api.submitInterest({ email, source: "pricing_page" });
      setStatus("success");
      setMessage(
        "You're on the list! We'll reach out when Cloud Pro is ready for you.",
      );
      setEmail("");
    } catch (error: any) {
      console.error("Submission error:", error);
      setStatus("error");
      setMessage(error.message || "Something went wrong. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="glass-panel border-acid-lime/30 bg-acid-lime/[0.05] rounded-[2.5rem] p-10 text-center space-y-6 animate-in fade-in zoom-in duration-700 shadow-[0_0_50px_rgba(var(--theme-lime-rgb),0.1)]">
        <div className="w-16 h-16 rounded-full bg-acid-lime/20 flex items-center justify-center mx-auto border border-acid-lime/40 shadow-inner">
          <Check className="w-8 h-8 text-acid-lime" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black uppercase tracking-tight italic text-foreground">
            Priority Protocol_ Engaged
          </h3>
          <p className="text-muted-foreground text-sm mx-auto font-medium opacity-80 leading-relaxed">
            {message}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setStatus("idle")}
          className="rounded-full border-acid-lime/20 text-[10px] font-black uppercase tracking-[0.2em] px-10 h-12 hover:bg-acid-lime hover:text-primary-foreground transition-all duration-500"
        >
          Submit another
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto group">
      <div className="flex items-center justify-center gap-3 mb-6">
        <Shield className="w-4 h-4 text-acid-lime animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-acid-lime italic">
          Join Waitlist
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        className={`relative flex flex-col md:flex-row items-stretch gap-2 p-2 rounded-[2rem]`}
      >
        <div className="flex-1 relative bg-card/5">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <span className="text-acid-lime/40 font-mono text-xs font-bold mr-2">
              @
            </span>
          </div>
          <Input
            type="email"
            placeholder="Enter your email to show interest"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "loading"}
            className="bg-transparent border-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground/30 font-black  tracking-widest h-14 pl-12 pr-6 text-sm"
          />
        </div>

        <Button
          type="submit"
          disabled={status === "loading"}
          className="h-14 px-10 rounded-[1.5rem] bg-foreground text-background font-black uppercase tracking-[0.2em] text-[10px] hover:bg-acid-lime hover:text-primary-foreground transition-all duration-500 active:scale-95 flex items-center justify-center gap-3 min-w-[200px]"
        >
          {status === "loading" ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Deploy Interest
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>

      {status === "error" && (
        <div className="mt-4 text-center animate-in slide-in-from-top-2 duration-500">
          <span className="text-destructive text-[10px] font-black uppercase tracking-[0.2em] bg-destructive/10 px-4 py-1.5 rounded-full border border-destructive/20">
            {message}
          </span>
        </div>
      )}

      <p className="mt-8 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.3em] text-center">
        No Spam. Only infrastructure updates.
      </p>
    </div>
  );
}
