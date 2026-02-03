'use client'

import React from "react"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2, Check, Lock, CreditCard, DollarSign } from 'lucide-react'

export default function Payment() {
  const [plan, setPlan] = useState<'starter' | 'pro' | 'enterprise'>('pro')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Card form state
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCVC, setCardCVC] = useState('')

  // Billing address state
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [country, setCountry] = useState('US')

  const plans = {
    starter: { name: 'Starter', price: 29, description: '10,000 heartbeats/month' },
    pro: { name: 'Pro', price: 99, description: '100,000 heartbeats/month' },
    enterprise: { name: 'Enterprise', price: 'Custom', description: 'Unlimited heartbeats' }
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(' ')
    } else {
      return value
    }
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`
    }
    return v
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsProcessing(true)

    try {
      // Validation
      if (paymentMethod === 'card') {
        if (!cardName || !cardNumber || !cardExpiry || !cardCVC) {
          throw new Error('Please fill in all card details')
        }
        if (cardNumber.replace(/\s/g, '').length !== 16) {
          throw new Error('Card number must be 16 digits')
        }
      }

      if (!email || !address || !city || !zipCode) {
        throw new Error('Please fill in all billing address details')
      }

      // TODO: Replace with backend API call
      // const response = await fetch('/api/payment/checkout', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     plan,
      //     paymentMethod,
      //     ...(paymentMethod === 'card' && { cardNumber, cardExpiry, cardCVC, cardName }),
      //     email,
      //     address,
      //     city,
      //     zipCode,
      //     country
      //   }),
      // })

      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      console.log('[v0] Payment submission:', {
        plan,
        paymentMethod,
        email,
        address
      })

      setSuccess(true)
      // TODO: Redirect to success page or dashboard
      // router.push('/payment/success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment processing failed')
      console.error('[v0] Payment error:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Payment Successful</h1>
              <p className="text-muted-foreground">
                Your {plans[plan].name} plan is now active. Welcome to StillUp!
              </p>
            </div>
            <div className="bg-secondary border border-border rounded-lg p-6 text-left space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span className="text-foreground font-semibold">{plans[plan].name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="text-foreground font-semibold">
                  {typeof plans[plan].price === 'number' ? `$${plans[plan].price}/mo` : plans[plan].price}
                </span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="text-foreground font-semibold">{email}</span>
              </div>
            </div>
            <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <header className="border-b border-border bg-secondary/30 sticky top-0 z-50">
        <div className="flex items-center justify-between h-16 px-6 max-w-5xl mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground">
              S
            </div>
            <span className="font-bold text-foreground hidden sm:inline">StillUp</span>
          </Link>
          <Link href="/">
            <Button variant="outline">Back</Button>
          </Link>
        </div>
      </header>

      <div className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-2">Choose Your Plan</h1>
            <p className="text-lg text-muted-foreground">Select a plan and complete your payment</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-0 mb-12">
            {/* Plan Selection Cards */}
            {Object.entries(plans).map(([key, p]) => (
              <div
                key={key}
                onClick={() => setPlan(key as typeof plan)}
                className={`lg:px-6 py-8 cursor-pointer rounded-lg border-2 transition ${
                  plan === key
                    ? 'border-primary bg-secondary'
                    : 'border-border bg-secondary/50 hover:border-border/80'
                }`}
              >
                <h3 className="text-xl font-bold text-foreground mb-2">{p.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-primary">
                    {typeof p.price === 'number' ? `$${p.price}` : p.price}
                  </span>
                  {typeof p.price === 'number' && <span className="text-muted-foreground">/mo</span>}
                </div>
                <p className="text-muted-foreground text-sm mb-6">{p.description}</p>
                <Button
                  variant={plan === key ? 'default' : 'outline'}
                  className={`w-full ${plan === key ? 'bg-primary text-primary-foreground' : 'border-border text-foreground'}`}
                >
                  {plan === key ? 'Selected' : 'Select'}
                </Button>
              </div>
            ))}
          </div>

          {/* Checkout Form */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Payment Form */}
            <div className="lg:col-span-2">
              <div className="bg-secondary border border-border rounded-lg p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Payment Method Selection */}
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-4">Payment Method</h2>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`p-4 rounded-lg border-2 transition flex items-center justify-center gap-2 ${
                          paymentMethod === 'card'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-border/80'
                        }`}
                      >
                        <CreditCard className="w-5 h-5" />
                        <span className="text-foreground font-medium">Credit Card</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('paypal')}
                        className={`p-4 rounded-lg border-2 transition flex items-center justify-center gap-2 ${
                          paymentMethod === 'paypal'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-border/80'
                        }`}
                      >
                        <DollarSign className="w-5 h-5" />
                        <span className="text-foreground font-medium">PayPal</span>
                      </button>
                    </div>
                  </div>

                  {/* Card Details */}
                  {paymentMethod === 'card' && (
                    <div className="space-y-6 pt-6 border-t border-border">
                      <h3 className="font-semibold text-foreground">Card Details</h3>

                      {/* Card Name */}
                      <div>
                        <Label htmlFor="cardName" className="text-foreground mb-2 block">
                          Cardholder Name
                        </Label>
                        <Input
                          id="cardName"
                          type="text"
                          placeholder="John Doe"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          disabled={isProcessing}
                          required
                          className="bg-background border-border text-foreground"
                        />
                      </div>

                      {/* Card Number */}
                      <div>
                        <Label htmlFor="cardNumber" className="text-foreground mb-2 block">
                          Card Number
                        </Label>
                        <Input
                          id="cardNumber"
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          maxLength={19}
                          disabled={isProcessing}
                          required
                          className="bg-background border-border text-foreground font-mono"
                        />
                      </div>

                      {/* Expiry & CVC */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="cardExpiry" className="text-foreground mb-2 block">
                            Expiry Date
                          </Label>
                          <Input
                            id="cardExpiry"
                            type="text"
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                            maxLength={5}
                            disabled={isProcessing}
                            required
                            className="bg-background border-border text-foreground"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cardCVC" className="text-foreground mb-2 block">
                            CVC
                          </Label>
                          <Input
                            id="cardCVC"
                            type="text"
                            placeholder="123"
                            value={cardCVC}
                            onChange={(e) => setCardCVC(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            maxLength={4}
                            disabled={isProcessing}
                            required
                            className="bg-background border-border text-foreground"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PayPal Notice */}
                  {paymentMethod === 'paypal' && (
                    <div className="p-4 bg-background border border-border rounded-lg pt-6 border-t">
                      <p className="text-muted-foreground text-sm">
                        You will be redirected to PayPal to complete your payment securely.
                      </p>
                    </div>
                  )}

                  {/* Billing Address */}
                  <div className="space-y-6 pt-6 border-t border-border">
                    <h3 className="font-semibold text-foreground">Billing Address</h3>

                    <div>
                      <Label htmlFor="email" className="text-foreground mb-2 block">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isProcessing}
                        required
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div>
                      <Label htmlFor="address" className="text-foreground mb-2 block">
                        Street Address
                      </Label>
                      <Input
                        id="address"
                        type="text"
                        placeholder="123 Main St"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        disabled={isProcessing}
                        required
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city" className="text-foreground mb-2 block">
                          City
                        </Label>
                        <Input
                          id="city"
                          type="text"
                          placeholder="New York"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          disabled={isProcessing}
                          required
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                      <div>
                        <Label htmlFor="zipCode" className="text-foreground mb-2 block">
                          ZIP Code
                        </Label>
                        <Input
                          id="zipCode"
                          type="text"
                          placeholder="10001"
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                          disabled={isProcessing}
                          required
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="country" className="text-foreground mb-2 block">
                        Country
                      </Label>
                      <select
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        disabled={isProcessing}
                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground"
                      >
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="GB">United Kingdom</option>
                        <option value="DE">Germany</option>
                        <option value="FR">France</option>
                        <option value="AU">Australia</option>
                        <option value="JP">Japan</option>
                        <option value="IN">India</option>
                      </select>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-6 text-base"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Complete Purchase - {typeof plans[plan].price === 'number' ? `$${plans[plan].price}` : plans[plan].price}/mo
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Your payment information is encrypted and secure. We use industry-standard encryption.
                  </p>
                </form>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="sticky top-8 bg-secondary border border-border rounded-lg p-6 space-y-6">
                <h3 className="font-semibold text-foreground text-lg">Order Summary</h3>

                <div className="space-y-3 border-b border-border pb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{plans[plan].name} Plan</span>
                    <span className="text-foreground font-semibold">
                      {typeof plans[plan].price === 'number' ? `$${plans[plan].price}` : 'Custom'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Billing Period</span>
                    <span className="text-foreground font-semibold">Monthly</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-foreground font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    {typeof plans[plan].price === 'number' ? `$${plans[plan].price}` : 'Custom'}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{plans[plan].description}</span>
                  </div>
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Real-time Alerts</span>
                  </div>
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Failure Pattern Learning</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
