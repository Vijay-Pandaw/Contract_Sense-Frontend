import React, { useState } from 'react'
import { LockKeyhole, Mail, Scale, ShieldCheck, Sparkles, User } from 'lucide-react'
import { forgotPasswordApi, loginApi, signupApi } from './api'

type AuthPageProps = {
  onAuthenticated: (user: any, token: string) => void
}

type AuthMode = 'login' | 'signup' | 'forgot'

export default function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [submitting, setSubmitting] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', companyName: '' })
  const [forgotEmail, setForgotEmail] = useState('')

  const clearFeedback = () => {
    setAuthError('')
    setAuthMessage('')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    clearFeedback()
    setSubmitting(true)

    const res = await loginApi(loginForm.email, loginForm.password)
    setSubmitting(false)

    if (!res?.success || !res?.token || !res?.user) {
      setAuthError(res?.error || 'Unable to login. Please check your credentials.')
      return
    }

    onAuthenticated(res.user, res.token)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    clearFeedback()
    setSubmitting(true)

    const res = await signupApi(signupForm)
    setSubmitting(false)

    if (!res?.success || !res?.token || !res?.user) {
      setAuthError(res?.error || 'Unable to create account right now.')
      return
    }

    onAuthenticated(res.user, res.token)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    clearFeedback()
    setSubmitting(true)

    const res = await forgotPasswordApi(forgotEmail)
    setSubmitting(false)

    if (!res?.success) {
      setAuthError(res?.error || 'Unable to process password reset request.')
      return
    }

    setAuthMessage(res.message || 'Password reset instructions sent to your email.')
  }

  return (
    <div className="auth-page">
      <div className="auth-backdrop" />
      <div className="auth-layout">
        <section className="auth-panel auth-panel-brand">
          <button className="brand">
            <div className="brand-mark">
              <Scale className="w-5 h-5" />
            </div>
            <span>
              Contract<span>Sense</span>
            </span>
          </button>

          <p className="eyebrow mt-6">
            <Sparkles className="w-4 h-4 text-[#f36963]" /> Contract Intelligence Platform
          </p>
          <h1>
            Review contracts faster. <em>Negotiate from strength.</em>
          </h1>
          <p className="hero-description">
            Securely sign in to analyze contracts, apply redlines, collaborate with counsel, and keep every legal decision auditable.
          </p>

          <div className="auth-feature-list">
            <div>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>MSMED compliance checks and legal risk scoring</span>
            </div>
            <div>
              <LockKeyhole className="w-4 h-4 text-slate-700" />
              <span>Encrypted workspace with role-based collaboration</span>
            </div>
            <div>
              <User className="w-4 h-4 text-[#f36963]" />
              <span>Personalized dashboard and contract history</span>
            </div>
          </div>
        </section>

        <section className="auth-panel auth-panel-form">
          <div className="auth-tabs">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => { clearFeedback(); setMode('login') }}>
              Login
            </button>
            <button className={mode === 'signup' ? 'active' : ''} onClick={() => { clearFeedback(); setMode('signup') }}>
              Sign Up
            </button>
            <button className={mode === 'forgot' ? 'active' : ''} onClick={() => { clearFeedback(); setMode('forgot') }}>
              Reset
            </button>
          </div>

          {authError && <p className="auth-feedback auth-feedback-error">{authError}</p>}
          {authMessage && <p className="auth-feedback auth-feedback-success">{authMessage}</p>}

          {mode === 'login' && (
            <form className="auth-form" onSubmit={handleLogin}>
              <label>
                Email
                <div className="auth-input-wrap">
                  <Mail className="w-4 h-4" />
                  <input
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="you@company.com"
                  />
                </div>
              </label>

              <label>
                Password
                <div className="auth-input-wrap">
                  <LockKeyhole className="w-4 h-4" />
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="Enter your password"
                  />
                </div>
              </label>

              <button type="submit" className="button button-coral w-full" disabled={submitting}>
                {submitting ? 'Signing in...' : 'Login to Dashboard'}
              </button>
              <p className="auth-helper-text">Demo user: priya.sharma@contractsense.ai / Password@123</p>
            </form>
          )}

          {mode === 'signup' && (
            <form className="auth-form" onSubmit={handleSignup}>
              <label>
                Full Name
                <input
                  type="text"
                  required
                  value={signupForm.name}
                  onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                  placeholder="Asha Mehta"
                />
              </label>
              <label>
                Work Email
                <input
                  type="email"
                  required
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  placeholder="asha@company.com"
                />
              </label>
              <label>
                Company Name
                <input
                  type="text"
                  value={signupForm.companyName}
                  onChange={(e) => setSignupForm({ ...signupForm, companyName: e.target.value })}
                  placeholder="Acme Legal Advisory"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  required
                  minLength={8}
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  placeholder="At least 8 characters"
                />
              </label>

              <button type="submit" className="button button-coral w-full" disabled={submitting}>
                {submitting ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form className="auth-form" onSubmit={handleForgotPassword}>
              <label>
                Account Email
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@company.com"
                />
              </label>

              <button type="submit" className="button button-dark w-full" disabled={submitting}>
                {submitting ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
