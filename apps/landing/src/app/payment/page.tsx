"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import {
  AlertCircle,
  Loader2,
  Check,
  Lock,
  CreditCard,
  DollarSign,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Cpu,
  Activity,
} from "lucide-react";

function PaymentContent() {
  const { user, isLoading, activeOrganization, refresh } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [plan, setPlan] = useState<"starter" | "pro" | "enterprise">("pro");
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || "";

  // 🛡️ Authentication Guard for Payment
  useEffect(() => {
    if (!isLoading && !user) {
      const currentPlan = searchParams.get("plan") || "pro";
      window.location.href = `${dashboardUrl}/auth/signup?redirect=${encodeURIComponent(window.location.href)}`;
    }
  }, [user, isLoading, dashboardUrl, searchParams]);

  useEffect(() => {
    const requestedPlan = searchParams.get("plan");
    if (
      requestedPlan &&
      ["starter", "pro", "enterprise"].includes(requestedPlan)
    ) {
      setPlan(requestedPlan as any);
    }
  }, [searchParams]);

  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal">("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Card form state
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");

  // Billing address state
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("US");

  // Redirect to dashboard after success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        window.location.href = `${dashboardUrl}/dashboard`;
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, dashboardUrl]);

  const plans = {
    starter: {
      name: "Base Sentinel",
      price: 0,
      description: "Up to 5 monitors",
    },
    pro: {
      name: "Pro Infrastructure",
      price: 29,
      description: "Unlimited ReplayGuard + Tunnels",
    },
    enterprise: {
      name: "Global Enterprise",
      price: "Custom",
      description: "Complete Safety Suite",
    },
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    return v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsProcessing(true);

    try {
      if (paymentMethod === "card") {
        if (!cardName || !cardNumber || !cardExpiry || !cardCVC)
          throw new Error("Please fill in all card details");
        if (cardNumber.replace(/\s/g, "").length !== 16)
          throw new Error("Card number must be 16 digits");
      }
      if (!email || !address || !city || !zipCode)
        throw new Error("Please fill in all billing address details");

      const projectId = activeOrganization?.id;
      if (!projectId) throw new Error("No active project found");

      // 💳 Process Plan Upgrade (Mocked but persisted)
      await api.upgradePlan(
        projectId,
        plan === "pro" ? "PRO" : plan === "enterprise" ? "ENTERPRISE" : "FREE",
      );

      await new Promise((resolve) => setTimeout(resolve, 2000));
      setSuccess(true);
      refresh(); // Reload user state to reflect new plan
    } catch (err) {
      console.error("Payment Error:", err);
      setError(
        err instanceof Error ? err.message : "Payment processing failed",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background bg-tech-grid">
        <div className="relative">
          <div className="w-16 h-16 border-2 border-acid-lime/20 border-t-acid-lime rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="w-6 h-6 text-acid-lime animate-pulse" />
          </div>
        </div>
        <p className="mt-8 text-[10px] font-black uppercase tracking-[0.4em] text-acid-lime italic animate-pulse">
          Initializing_Secure_Gateway...
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background bg-tech-grid flex items-center justify-center p-6 sm:p-12">
        <div className="w-full ">
          <div className="glass-panel border-acid-lime/20 rounded-[3rem] p-12 text-center space-y-8 shadow-2xl shadow-acid-lime/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-acid-lime to-transparent opacity-50"></div>
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-[2rem] bg-acid-lime/10 flex items-center justify-center border border-acid-lime/30 animate-in zoom-in duration-700 relative">
                <div className="absolute inset-0 rounded-[2rem] bg-acid-lime/20 animate-pulse"></div>
                <ShieldCheck className="w-12 h-12 text-acid-lime relative z-10" />
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl font-black text-foreground uppercase tracking-tighter italic leading-none">
                SENTINEL_DEPLOYED
              </h1>
              <p className="text-muted-foreground font-medium text-lg">
                Your{" "}
                <span className="text-acid-lime font-black italic">
                  Replaysafe {plans[plan].name}
                </span>{" "}
                protocols are now active.
              </p>
            </div>
            <div className="bg-foreground/[0.03] border border-border/5 rounded-[2rem] p-8 text-left space-y-4 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground uppercase tracking-[0.3em] opacity-40">
                  Registry_Tier
                </span>
                <span className="text-acid-lime font-black uppercase italic">
                  {plans[plan].name}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-border/5 pt-4">
                <span className="text-muted-foreground uppercase tracking-[0.3em] opacity-40">
                  Transaction_ID
                </span>
                <span className="text-foreground/60 font-black">
                  ST-SENTINEL-{(Math.random() * 100000).toFixed(0)}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-border/5 pt-4">
                <span className="text-muted-foreground uppercase tracking-[0.3em] opacity-40">
                  Monthly_Recur
                </span>
                <span className="text-foreground font-black">
                  {typeof plans[plan].price === "number"
                    ? `$${plans[plan].price}.00`
                    : plans[plan].price}
                </span>
              </div>
            </div>
            <div className="pt-4">
              <Button
                asChild
                className="w-3/3 h-15 bg-acid-lime text-[#0f1a14] rounded-2xl font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-[0_0_40px_rgba(var(--theme-lime-rgb),0.3)] hover:scale-[1.02] active:scale-[0.98] text-xs"
              >
                <a href={`${dashboardUrl}/dashboard`}>Access Command Center</a>
              </Button>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 italic">
              Redirecting to sentinel hub in 5s...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-tech-grid text-foreground selection:bg-acid-lime selection:text-primary-foreground">
      {/* Background Glow */}
      <div className="radial-glow-hero opacity-30 pointer-events-none"></div>

      {/* Navigation */}
      <header className="h-24 px-8 flex items-center justify-between z-50 relative border-b border-border/5 backdrop-blur-md">
        <Logo />
        <Link
          href="/pricing"
          className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-acid-lime transition-all flex items-center gap-2 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Plans
        </Link>
      </header>

      <div className="py-20 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-20 space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-acid-lime/5 border border-acid-lime/20">
              <Lock className="w-3.5 h-3.5 text-acid-lime" />
              <span className="text-[10px] font-black uppercase tracking-widest text-acid-lime italic">
                Transaction_Secure: AES-256
              </span>
            </div>
            <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-foreground uppercase italic leading-none">
              Deploy <span className="glow-lime">Sentinel</span>
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
            {Object.entries(plans).map(([key, p]) => (
              <div
                key={key}
                onClick={() => setPlan(key as typeof plan)}
                className={`glass-panel p-8 cursor-pointer rounded-[2.5rem] border transition-all duration-500 relative overflow-hidden group ${
                  plan === key
                    ? "border-acid-lime/40 bg-acid-lime/[0.04] shadow-2xl shadow-acid-lime/5"
                    : "border-border/10 hover:border-border/20"
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-sm font-black text-foreground uppercase tracking-tight">
                    {p.name}
                  </h3>
                  {plan === key && <Check className="w-5 h-5 text-acid-lime" />}
                </div>
                <div className="mb-4 flex items-baseline gap-1">
                  <span
                    className={`text-4xl font-black ${plan === key ? "text-acid-lime" : "text-foreground"}`}
                  >
                    {typeof p.price === "number" ? `$${p.price}` : p.price}
                  </span>
                  {typeof p.price === "number" && (
                    <span className="text-muted-foreground font-bold text-sm">
                      /mo
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-8">
                  {p.description}
                </p>

                <div
                  className={`w-full h-12 rounded-xl border flex items-center justify-center font-black uppercase tracking-widest text-[9px] transition-all ${
                    plan === key
                      ? "bg-acid-lime border-acid-lime text-primary-foreground"
                      : "border-border/10 text-muted-foreground group-hover:border-border/30"
                  }`}
                >
                  {plan === key ? "Active_Selection" : "Select_Tier"}
                </div>
              </div>
            ))}
          </div>

          {/* Checkout Form */}
          <div className="grid lg:grid-cols-3 gap-12 items-start">
            {/* Payment Form */}
            <div className="lg:col-span-2">
              <div className="glass-panel border-border/10 rounded-[3rem] p-12 space-y-12">
                <form onSubmit={handleSubmit} className="space-y-12">
                  {/* Payment Method Selection */}
                  <div className="space-y-6">
                    <h2 className="text-xl font-black text-foreground uppercase tracking-tight italic flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-acid-lime" />{" "}
                      Payment_Gateway
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("card")}
                        className={`p-6 rounded-2xl border transition-all duration-300 flex items-center justify-between group ${
                          paymentMethod === "card"
                            ? "border-acid-lime/40 bg-acid-lime/[0.04]"
                            : "border-border/10 hover:border-border/20"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <CreditCard
                            className={`w-5 h-5 ${paymentMethod === "card" ? "text-acid-lime" : "text-muted-foreground"}`}
                          />
                          <span className="font-black uppercase tracking-widest text-[10px]">
                            Secure_Card
                          </span>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border-2 transition-all ${paymentMethod === "card" ? "border-acid-lime bg-acid-lime" : "border-border/20"}`}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("paypal")}
                        className={`p-6 rounded-2xl border transition-all duration-300 flex items-center justify-between group ${
                          paymentMethod === "paypal"
                            ? "border-acid-lime/40 bg-acid-lime/[0.04]"
                            : "border-border/10 hover:border-border/20"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <DollarSign
                            className={`w-5 h-5 ${paymentMethod === "paypal" ? "text-acid-lime" : "text-muted-foreground"}`}
                          />
                          <span className="font-black uppercase tracking-widest text-[10px]">
                            PayPal_Express
                          </span>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border-2 transition-all ${paymentMethod === "paypal" ? "border-acid-lime bg-acid-lime" : "border-border/20"}`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Card Details */}
                  {paymentMethod === "card" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic ml-1">
                            Cardholder_Identity
                          </Label>
                          <Input
                            placeholder="John Doe"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            disabled={isProcessing}
                            required
                            className="h-14 bg-foreground/[0.02] border-border/10 focus:border-acid-lime/50 rounded-2xl font-bold px-6"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic ml-1">
                            Card_Number
                          </Label>
                          <Input
                            placeholder="1234 5678 9012 3456"
                            value={cardNumber}
                            onChange={(e) =>
                              setCardNumber(formatCardNumber(e.target.value))
                            }
                            maxLength={19}
                            disabled={isProcessing}
                            required
                            className="h-14 bg-foreground/[0.02] border-border/10 focus:border-acid-lime/50 rounded-2xl font-mono px-6"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic ml-1">
                            Expiry_Date
                          </Label>
                          <Input
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={(e) =>
                              setCardExpiry(formatExpiry(e.target.value))
                            }
                            maxLength={5}
                            disabled={isProcessing}
                            required
                            className="h-14 bg-foreground/[0.02] border-border/10 focus:border-acid-lime/50 rounded-2xl font-bold px-6"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic ml-1">
                            Security_Code (CVC)
                          </Label>
                          <Input
                            placeholder="123"
                            value={cardCVC}
                            onChange={(e) =>
                              setCardCVC(
                                e.target.value.replace(/\D/g, "").slice(0, 4),
                              )
                            }
                            maxLength={4}
                            disabled={isProcessing}
                            required
                            className="h-14 bg-foreground/[0.02] border-border/10 focus:border-acid-lime/50 rounded-2xl font-bold px-6"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Billing Address */}
                  <div className="space-y-8 pt-12 border-t border-border/5">
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight italic">
                      Registry_Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic ml-1">
                          Email_Address
                        </Label>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isProcessing}
                          required
                          className="h-14 bg-foreground/[0.02] border-border/10 focus:border-acid-lime/50 rounded-2xl font-bold px-6"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic ml-1">
                          Street_Address
                        </Label>
                        <Input
                          placeholder="123 Main St"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          disabled={isProcessing}
                          required
                          className="h-14 bg-foreground/[0.02] border-border/10 focus:border-acid-lime/50 rounded-2xl font-bold px-6"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic ml-1">
                          City
                        </Label>
                        <Input
                          placeholder="New York"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          disabled={isProcessing}
                          required
                          className="h-14 bg-foreground/[0.02] border-border/10 focus:border-acid-lime/50 rounded-2xl font-bold px-6"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic ml-1">
                          ZIP_Code
                        </Label>
                        <Input
                          placeholder="10001"
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                          disabled={isProcessing}
                          required
                          className="h-14 bg-foreground/[0.02] border-border/10 focus:border-acid-lime/50 rounded-2xl font-bold px-6"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Error & Submit */}
                  <div className="space-y-6 pt-12 border-t border-border/5">
                    {error && (
                      <div className="flex items-center gap-3 p-6 bg-destructive/10 border border-destructive/20 rounded-3xl animate-in shake duration-500">
                        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                        <p className="text-xs font-black uppercase tracking-widest text-destructive">
                          {error}
                        </p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full h-20 bg-acid-lime text-[#0f1a14] hover:opacity-90 rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs shadow-[0_0_40px_rgba(var(--theme-lime-rgb),0.2)] hover:shadow-[0_0_60px_rgba(var(--theme-lime-rgb),0.4)] transition-all active:scale-[0.98]"
                    >
                      {isProcessing ? (
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Processing_Protocol...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="w-5 h-5" />
                          <span>
                            Activate_Pro_Sentinel -{" "}
                            {typeof plans[plan].price === "number"
                              ? `$${plans[plan].price}`
                              : plans[plan].price}
                            /mo
                          </span>
                        </div>
                      )}
                    </Button>
                    <p className="text-[9px] text-muted-foreground text-center font-bold uppercase tracking-[0.2em] italic opacity-40">
                      Encrypted_Gateway - Your payment information is never
                      stored in plaintext.
                    </p>
                  </div>
                </form>
              </div>
            </div>

            {/* Side Info */}
            <div className="space-y-8 sticky top-24">
              <div className="glass-panel border-acid-lime/10 rounded-[2.5rem] p-10 space-y-8 bg-acid-lime/[0.01]">
                <h3 className="text-lg font-black uppercase tracking-tight italic">
                  Deployment_Summary
                </h3>
                <div className="space-y-4 border-b border-border/5 pb-8">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground uppercase tracking-widest font-black text-[9px]">
                      Registry_Tier
                    </span>
                    <span className="text-foreground font-black italic">
                      {plans[plan].name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground uppercase tracking-widest font-black text-[9px]">
                      Billing_Period
                    </span>
                    <span className="text-foreground font-black italic">
                      Monthly_Recur
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Total_Fee
                  </span>
                  <span className="text-4xl font-black text-acid-lime tracking-tighter">
                    {typeof plans[plan].price === "number"
                      ? `$${plans[plan].price}`
                      : "Custom"}
                  </span>
                </div>

                <div className="space-y-4 pt-4">
                  <Benefit
                    icon={<ShieldCheck />}
                    label="Replay-Safe Execution"
                  />
                  <Benefit icon={<Zap />} label="Real-time Tunnel Telemetry" />
                  <Benefit icon={<Cpu />} label="Pattern Recognition Engine" />
                </div>
              </div>

              <div className="p-8 border border-border/5 rounded-3xl space-y-4 opacity-60 hover:opacity-100 transition-opacity">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                  Deployment_Help?
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Need custom sentinel configurations or enterprise-grade
                  auditing?{" "}
                  <Link
                    href="mailto:sales@Replaysafe.io"
                    className="text-acid-lime underline underline-offset-4"
                  >
                    Contact Protocol Support
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Benefit({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 group">
      <div className="w-8 h-8 rounded-xl bg-acid-lime/10 flex items-center justify-center border border-acid-lime/20 group-hover:bg-acid-lime group-hover:border-acid-lime transition-all duration-300">
        {React.cloneElement(icon as React.ReactElement<any>, {
          className: "w-4 h-4 text-acid-lime group-hover:text-[#0f1a14]",
        })}
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-foreground/70 group-hover:text-foreground transition-colors italic">
        {label}
      </span>
    </div>
  );
}

export default function Payment() {
  return (
    <React.Suspense
      fallback={
        <div className="h-screen flex flex-col items-center justify-center bg-background bg-tech-grid">
          <div className="relative">
            <div className="w-16 h-16 border-2 border-acid-lime/20 border-t-acid-lime rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity className="w-6 h-6 text-acid-lime animate-pulse" />
            </div>
          </div>
          <p className="mt-8 text-[10px] font-black uppercase tracking-[0.4em] text-acid-lime italic animate-pulse">
            Loading_Secure_Checkout...
          </p>
        </div>
      }
    >
      <PaymentContent />
    </React.Suspense>
  );
}
