import React, { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Building,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react'
import {
  loginWithGoogle,
  loginWithApple,
  loginWithEmail,
  signupWithEmail,
  resetPassword,
  FirebaseUser,
} from './firebase'

type AuthPageProps = {
  onAuthenticated: (user: FirebaseUser, token: string) => void
}

type AuthMode = 'login' | 'signup' | 'forgot'

export default function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [submitting, setSubmitting] = useState(false)
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', companyName: '' })
  const [forgotEmail, setForgotEmail] = useState('')

  const clearFeedback = () => {
    setAuthError('')
    setAuthMessage('')
  }

  // --- 1. Real Firebase Email & Password Login ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    clearFeedback()
    if (!loginForm.email.trim() || !loginForm.password) {
      setAuthError('Please enter both your email address and password.')
      return
    }
    setSubmitting(true)

    try {
      const res = await loginWithEmail(loginForm.email.trim(), loginForm.password)
      setSubmitting(false)

      if (!res.success || !res.user) {
        setAuthError(res.error || 'Invalid email or password. Please try again.')
        return
      }

      const token = await res.user.getIdToken()
      onAuthenticated(res.user, token)
    } catch (err: any) {
      setSubmitting(false)
      setAuthError(err.message || 'Authentication error. Please try again.')
    }
  }

  // --- 2. Real Firebase Registration ---
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    clearFeedback()
    if (!signupForm.name.trim() || !signupForm.email.trim() || !signupForm.password) {
      setAuthError('Please fill in your name, email, and password.')
      return
    }
    if (signupForm.password.length < 8) {
      setAuthError('Password must be at least 8 characters long.')
      return
    }
    setSubmitting(true)

    try {
      const res = await signupWithEmail(
        signupForm.name.trim(),
        signupForm.email.trim(),
        signupForm.password
      )
      setSubmitting(false)

      if (!res.success || !res.user) {
        setAuthError(res.error || 'Unable to create account right now. Please try again.')
        return
      }

      const token = await res.user.getIdToken()
      onAuthenticated(res.user, token)
    } catch (err: any) {
      setSubmitting(false)
      setAuthError(err.message || 'Account registration error. Please try again.')
    }
  }

  // --- 3. Real Firebase Forgot Password (Password Reset Email) ---
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    clearFeedback()
    if (!forgotEmail.trim()) {
      setAuthError('Please enter your account email address.')
      return
    }
    setSubmitting(true)

    try {
      const res = await resetPassword(forgotEmail.trim())
      setSubmitting(false)

      if (!res.success) {
        setAuthError(res.error || 'Unable to process password reset request.')
        return
      }

      setAuthMessage(res.message || `Password reset instructions have been sent to ${forgotEmail.trim()}.`)
    } catch (err: any) {
      setSubmitting(false)
      setAuthError(err.message || 'Failed to dispatch password reset email.')
    }
  }

  // --- 4. Real Firebase Social Login (Google & Apple) ---
  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    clearFeedback()
    setSocialLoading(provider)

    try {
      const res = provider === 'google' ? await loginWithGoogle() : await loginWithApple()
      setSocialLoading(null)

      if (!res.success || !res.user) {
        setAuthError(res.error || `Unable to authenticate with ${provider === 'google' ? 'Google' : 'Apple'}.`)
        return
      }

      const token = await res.user.getIdToken()
      onAuthenticated(res.user, token)
    } catch (err: any) {
      setSocialLoading(null)
      setAuthError(`Unable to complete ${provider === 'google' ? 'Google' : 'Apple'} authentication.`)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-backdrop" />
      <div className="auth-layout">
        {/* Left Side: Brand & Product Value */}
        <section className="auth-panel auth-panel-brand">
          <div className="auth-brand-top">
            <div className="brand">
              <div className="brand-mark">
                <Scale className="w-5 h-5" />
              </div>
              <span>
                Contract<span>Sense</span>
              </span>
            </div>
            <span className="auth-badge-pill">
              <Sparkles className="w-3 h-3 text-[#f36963]" /> CONTRACT INTELLIGENCE PLATFORM
            </span>
          </div>

          <div className="auth-hero-content">
            <h1>
              Review contracts faster. <br />
              <em>Negotiate from strength.</em>
            </h1>
            <p className="hero-description">
              AI-powered contract intelligence that helps businesses identify risks, understand complex clauses, and negotiate with confidence.
            </p>

            <div className="auth-benefit-list">
              <div className="benefit-item">
                <div className="benefit-icon">
                  <Check className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <strong>Detect high-risk clauses</strong>
                  <p>Instant MSMED statutory audits, uncapped liability warnings, and one-sided exit flags.</p>
                </div>
              </div>

              <div className="benefit-item">
                <div className="benefit-icon">
                  <Check className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <strong>Understand contracts in plain language</strong>
                  <p>Translate complex legalese into clear business implications and cash-flow impact.</p>
                </div>
              </div>

              <div className="benefit-item">
                <div className="benefit-icon">
                  <Check className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <strong>Get actionable negotiation insights</strong>
                  <p>One-click pre-approved statutory redlines tailored to protect enterprise & MSME vendors.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-brand-footer">
            <div className="trust-indicator">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>MSMED Act 2006 & Indian Contract Act Compliance</span>
            </div>
            <div className="trust-indicator">
              <LockKeyhole className="w-4 h-4 text-slate-500" />
              <span>Firebase Authenticated Private Workspace</span>
            </div>
          </div>
        </section>

        {/* Right Side: Firebase Authentication Card */}
        <section className="auth-panel auth-panel-form">
          <div className="auth-card-inner">
            <div className="auth-header-block">
              {mode === 'login' && (
                <>
                  <h2>Welcome back</h2>
                  <p>Sign in to continue analyzing your contracts.</p>
                </>
              )}
              {mode === 'signup' && (
                <>
                  <h2>Create an account</h2>
                  <p>Start reviewing and redlining your vendor contracts in minutes.</p>
                </>
              )}
              {mode === 'forgot' && (
                <>
                  <h2>Reset password</h2>
                  <p>Enter your verified email address to receive reset instructions via Firebase.</p>
                </>
              )}
            </div>

            {/* Social Authentication: Google & Apple */}
            {mode !== 'forgot' && (
              <div className="social-auth-grid">
                <button
                  type="button"
                  className="social-button social-google"
                  disabled={socialLoading !== null || submitting}
                  onClick={() => handleSocialLogin('google')}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{socialLoading === 'google' ? 'Connecting to Google...' : 'Continue with Google'}</span>
                </button>

                <button
                  type="button"
                  className="social-button social-apple"
                  disabled={socialLoading !== null || submitting}
                  onClick={() => handleSocialLogin('apple')}
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.86c.62-.77 1.04-1.84.93-2.91-.9.04-2 .6-2.65 1.36-.58.67-.99 1.76-.87 2.81 1.02.08 2.06-.52 2.59-1.26" />
                  </svg>
                  <span>{socialLoading === 'apple' ? 'Connecting to Apple...' : 'Continue with Apple'}</span>
                </button>
              </div>
            )}

            {mode !== 'forgot' && (
              <div className="auth-divider">
                <span>Or continue with email</span>
              </div>
            )}

            {/* Feedback Alerts */}
            {authError && (
              <div className="auth-alert auth-alert-error">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}
            {authMessage && (
              <div className="auth-alert auth-alert-success">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>{authMessage}</span>
              </div>
            )}

            {/* Email/Password Login Form */}
            {mode === 'login' && (
              <form className="auth-form-body" onSubmit={handleLogin}>
                <div className="form-field">
                  <label htmlFor="login-email">Email Address</label>
                  <div className="input-group">
                    <Mail className="input-icon" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      placeholder="you@company.com"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="login-password">Password</label>
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => {
                        clearFeedback()
                        setMode('forgot')
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="input-group">
                    <LockKeyhole className="input-icon" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="button button-coral w-full submit-btn" disabled={submitting}>
                  {submitting ? 'Signing in...' : 'Sign in'}
                  {!submitting && <ArrowRight className="w-4 h-4" />}
                </button>

                <div className="auth-switch-footer">
                  <span>Don't have an account?</span>
                  <button
                    type="button"
                    className="switch-action-btn"
                    onClick={() => {
                      clearFeedback()
                      setMode('signup')
                    }}
                  >
                    Create an account
                  </button>
                </div>
              </form>
            )}

            {/* Email/Password Signup Form */}
            {mode === 'signup' && (
              <form className="auth-form-body" onSubmit={handleSignup}>
                <div className="form-field">
                  <label htmlFor="signup-name">Full Name</label>
                  <div className="input-group">
                    <User className="input-icon" />
                    <input
                      id="signup-name"
                      type="text"
                      required
                      autoComplete="name"
                      value={signupForm.name}
                      onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                      placeholder="e.g. Rajesh Mehta"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="signup-email">Work Email</label>
                  <div className="input-group">
                    <Mail className="input-icon" />
                    <input
                      id="signup-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      placeholder="you@company.com"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="signup-company">Company / Organization (Optional)</label>
                  <div className="input-group">
                    <Building className="input-icon" />
                    <input
                      id="signup-company"
                      type="text"
                      autoComplete="organization"
                      value={signupForm.companyName}
                      onChange={(e) => setSignupForm({ ...signupForm, companyName: e.target.value })}
                      placeholder="e.g. Apex Tech Solutions LLP"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="signup-password">Password</label>
                  <div className="input-group">
                    <LockKeyhole className="input-icon" />
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      placeholder="At least 8 characters"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="button button-coral w-full submit-btn" disabled={submitting}>
                  {submitting ? 'Creating account...' : 'Create Account'}
                  {!submitting && <ArrowRight className="w-4 h-4" />}
                </button>

                <div className="auth-switch-footer">
                  <span>Already have an account?</span>
                  <button
                    type="button"
                    className="switch-action-btn"
                    onClick={() => {
                      clearFeedback()
                      setMode('login')
                    }}
                  >
                    Sign in instead
                  </button>
                </div>
              </form>
            )}

            {/* Forgot Password Reset Form */}
            {mode === 'forgot' && (
              <form className="auth-form-body" onSubmit={handleForgotPassword}>
                <div className="form-field">
                  <label htmlFor="forgot-email">Account Email Address</label>
                  <div className="input-group">
                    <Mail className="input-icon" />
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@company.com"
                    />
                  </div>
                </div>

                <button type="submit" className="button button-coral w-full submit-btn" disabled={submitting}>
                  {submitting ? 'Sending instructions...' : 'Send Reset Instructions'}
                  {!submitting && <ArrowRight className="w-4 h-4" />}
                </button>

                <div className="auth-switch-footer">
                  <button
                    type="button"
                    className="switch-action-btn flex items-center justify-center gap-1.5 w-full"
                    onClick={() => {
                      clearFeedback()
                      setMode('login')
                    }}
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to sign in
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
