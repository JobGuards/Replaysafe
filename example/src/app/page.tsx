'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, Check, Play, RefreshCw, Terminal, CreditCard } from 'lucide-react';

interface ConsoleLog {
  text: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}

export default function Home() {
  const [loading, setLoading] = useState<string | null>(null);
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [simulateCrash, setSimulateCrash] = useState(false);
  const [lastPayment, setLastPayment] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    addLog('System initialized. Ready for payment flow simulation.', 'info');
  }, []);

  const addLog = (text: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [{ text, type, timestamp }, ...prev]);
  };

  const handleCheckout = async (planId: string) => {
    try {
      setLoading(planId);
      addLog(`Initializing checkout for ${planId} plan...`, 'info');

      // 1. Create order on backend
      const orderRes = await fetch('/api/pay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      addLog(`Razorpay order created: ${orderData.orderId}`, 'info');

      // 2. Open Razorpay checkout modal
      if (!(window as any).Razorpay) {
        throw new Error('Razorpay SDK not loaded. Check internet connection or layout script.');
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Replaysafe Demo App',
        description: `Premium Fulfill - ${planId.toUpperCase()}`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          addLog(`Razorpay Authorized! Payment ID: ${response.razorpay_payment_id}`, 'success');

          // Save payment details in state in case we want to manual-retry
          const paymentPayload = {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            planId,
            simulateCrash,
            attemptNumber: 1,
          };
          setLastPayment(paymentPayload);

          // 3. Verify on server
          await verifyPayment(paymentPayload);
        },
        prefill: {
          name: 'Demo User',
          email: 'user@example.com',
          contact: '9999999999',
        },
        theme: {
          color: '#6366f1',
        },
        modal: {
          ondismiss: () => {
            addLog('Payment modal closed by user.', 'warning');
            setLoading(null);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      addLog(err.message || 'Checkout failed', 'error');
      setLoading(null);
    }
  };

  const verifyPayment = async (payload: any) => {
    try {
      addLog(`Sending verification request (Attempt #${payload.attemptNumber})...`, 'info');
      setLoading('verify');

      const verifyRes = await fetch('/api/pay/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Verification failed');
      }

      addLog(`Server Response: Success!`, 'success');
      if (verifyData.fulfillment) {
        addLog(
          `Fulfillment result: Status: ${verifyData.fulfillment.status}, Credits Added: ${verifyData.fulfillment.creditsAdded}`,
          'success'
        );
      }
      setLoading(null);
    } catch (err: any) {
      addLog(`Server Error: ${err.message}`, 'error');
      addLog(`Safe Retry Available: Click the "Retry Verification" button below.`, 'warning');
      setLoading(null);
    }
  };

  const triggerRetry = async () => {
    if (!lastPayment) return;

    // Increment attempt number for logging clarity
    const retryPayload = {
      ...lastPayment,
      attemptNumber: lastPayment.attemptNumber + 1,
      simulateCrash: false, // Turn off crash on retry to let it complete!
    };

    setLastPayment(retryPayload);
    addLog(`Manually triggering retry for order: ${retryPayload.razorpay_order_id}`, 'warning');
    await verifyPayment(retryPayload);
  };

  if (!mounted) return null;

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <Shield size={24} />
          Replaysafe Pay
          <span className="logo-badge">Razorpay Demo</span>
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Realtime SDK Sandbox
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <h1>Prevent Double Charges &amp; Side Effects</h1>
        <p>
          Simulate payment fulfillment retries. Toggle "Simulate Server Crash" to see how ReplayGuard
          ensures orders are fulfilled exactly once even when the server crashes mid-workflow.
        </p>
      </section>

      {/* Grid of Pricing Cards */}
      <div className="grid">
        {/* Basic */}
        <div className="card">
          <h3 className="card-title">Basic Plan</h3>
          <p className="card-description">Perfect for small teams and developers testing sandboxes.</p>
          <div className="card-price-container">
            <span className="card-currency">₹</span>
            <span className="card-price">2</span>
            <span className="card-period">/mo</span>
          </div>
          <ul className="card-features">
            <li><Check size={16} /> 100 Demo Credits</li>
            <li><Check size={16} /> Basic monitoring logs</li>
            <li><Check size={16} /> Standard API access</li>
          </ul>
          <button
            className="btn"
            onClick={() => handleCheckout('basic')}
            disabled={loading !== null}
          >
            {loading === 'basic' ? (
              <svg className="spinner" viewBox="0 0 50 50">
                <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
              </svg>
            ) : (
              <>
                <CreditCard size={18} /> Buy Basic
              </>
            )}
          </button>
        </div>

        {/* Premium */}
        <div className="card" style={{ borderColor: 'rgba(99, 102, 241, 0.25)' }}>
          <span className="card-popular-badge">Popular</span>
          <h3 className="card-title">Premium Plan</h3>
          <p className="card-description">Advanced features, suitable for scaling agentic apps.</p>
          <div className="card-price-container">
            <span className="card-currency">₹</span>
            <span className="card-price">3</span>
            <span className="card-period">/mo</span>
          </div>
          <ul className="card-features">
            <li><Check size={16} /> 500 Demo Credits</li>
            <li><Check size={16} /> Instant webhooks &amp; rollbacks</li>
            <li><Check size={16} /> High integrity fail policy</li>
          </ul>
          <button
            className="btn"
            onClick={() => handleCheckout('premium')}
            disabled={loading !== null}
          >
            {loading === 'premium' ? (
              <svg className="spinner" viewBox="0 0 50 50">
                <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
              </svg>
            ) : (
              <>
                <Sparkles size={18} /> Upgrade Premium
              </>
            )}
          </button>
        </div>

        {/* Enterprise */}
        <div className="card">
          <h3 className="card-title">Enterprise Plan</h3>
          <p className="card-description">For mission-critical production systems needing full uptime.</p>
          <div className="card-price-container">
            <span className="card-currency">₹</span>
            <span className="card-price">4</span>
            <span className="card-period">/mo</span>
          </div>
          <ul className="card-features">
            <li><Check size={16} /> 3,000 Demo Credits</li>
            <li><Check size={16} /> Custom circuit breaking rules</li>
            <li><Check size={16} /> Dedicated guard sentinel</li>
          </ul>
          <button
            className="btn"
            onClick={() => handleCheckout('enterprise')}
            disabled={loading !== null}
          >
            {loading === 'enterprise' ? (
              <svg className="spinner" viewBox="0 0 50 50">
                <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
              </svg>
            ) : (
              <>
                <Shield size={18} /> Buy Enterprise
              </>
            )}
          </button>
        </div>
      </div>

      {/* Simulation Dashboard */}
      <section className="test-section">
        <div className="test-header">
          <div className="test-title">
            <Terminal size={18} style={{ color: 'var(--accent-primary)' }} />
            Simulation Console &amp; Controls
          </div>
          <button
            onClick={() => setLogs([])}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Clear logs
          </button>
        </div>

        <div className="console">
          {logs.length === 0 ? (
            <div className="console-line info">Logs will appear here when you trigger payments...</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className={`console-line ${log.type}`}>
                [{log.timestamp}] {log.text}
              </div>
            ))
          )}
        </div>

        <div className="controls">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={simulateCrash}
              onChange={(e) => setSimulateCrash(e.target.checked)}
            />
            Simulate Server Crash Post-Fulfillment (Throws 500 error after DB side-effect executes)
          </label>

          {lastPayment && (
            <button
              className="btn"
              style={{
                flex: '0 0 auto',
                width: 'auto',
                background: 'rgba(245, 158, 11, 0.1)',
                color: 'var(--accent-warning)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                boxShadow: 'none',
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                fontSize: '0.9rem'
              }}
              onClick={triggerRetry}
              disabled={loading !== null}
            >
              <RefreshCw size={14} /> Retry Verification (Same Tx)
            </button>
          )}
        </div>
      </section>

      <footer className="footer">
        Powered by <strong>Replaysafe Guard SDK</strong> &amp; <strong>Razorpay Checkout</strong>
      </footer>
    </div>
  );
}
