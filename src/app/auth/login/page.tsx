'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Sparkles, Mail, Lock, User, ArrowRight,
  HelpCircle, Loader2, AlertCircle, CheckCircle2
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const { login, signUp, loginOAuth, setGuestMode } = useAuthStore();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Password reset state
  const [isResetting, setIsResetting] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  // OAuth Modal states
  const [oauthProvider, setOauthProvider] = useState<'google' | 'apple' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    // Minor delay to simulate server communication
    await new Promise(resolve => setTimeout(resolve, 800));

    if (isSignUp) {
      if (!name || !email || !password) {
        setError('Please fill in all fields.');
        setIsLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        setIsLoading(false);
        return;
      }

      // Registers details, then redirects to onboarding
      const res = signUp({
        name,
        email,
        password,
        nativeLanguage: 'en',
        targetLanguages: ['es'],
        learningGoals: ['Travel'],
        skillLevel: 'Beginner',
        role: 'user'
      });

      if (res.success) {
        setSuccess('Account created! Let\'s customize your experience...');
        setTimeout(() => {
          router.push('/auth/onboarding');
        }, 1000);
      } else {
        setError(res.error || 'Failed to sign up.');
      }
    } else {
      if (!email || !password) {
        setError('Please fill in all fields.');
        setIsLoading(false);
        return;
      }

      const res = login(email, password);
      if (res.success) {
        setSuccess('Successfully logged in! Redirecting...');
        setTimeout(() => {
          router.push('/');
        }, 1000);
      } else {
        setError(res.error || 'Incorrect email or password.');
      }
    }
    setIsLoading(false);
  };

  const handleOAuthLogin = (provider: 'google' | 'apple', selectedEmail: string, selectedName: string) => {
    loginOAuth(provider, selectedEmail, selectedName);
    setOauthProvider(null);
    router.push('/');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSuccess(`Password reset instructions sent to ${resetEmail}!`);
    setIsResetting(false);
    setIsLoading(false);
  };

  const handleGuest = () => {
    setGuestMode();
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-bg-primary">
      {/* Dynamic Background Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[450px] h-[450px] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo and title */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-lg mb-3">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">TranslateGPT</h2>
          <p className="text-sm text-text-tertiary">Your path to conversational fluency</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <AnimatePresence mode="wait">
            {isResetting ? (
              /* Password Reset Flow */
              <motion.div
                key="reset"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <h3 className="text-lg font-semibold text-text-primary mb-2">Reset Password</h3>
                <p className="text-xs text-text-tertiary mb-6">
                  Enter your email address and we'll send you a simulation link to reset your password.
                </p>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="Email Address"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl glass border border-border text-text-primary text-sm focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full btn-primary py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsResetting(false)}
                    className="w-full text-center text-xs text-text-secondary hover:text-primary transition-colors font-medium mt-2"
                  >
                    Back to Login
                  </button>
                </form>
              </motion.div>
            ) : (
              /* Normal Sign In / Sign Up Flow */
              <motion.div
                key={isSignUp ? 'signup' : 'login'}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <div className="flex gap-4 border-b border-border mb-6">
                  <button
                    onClick={() => { setIsSignUp(false); setError(''); setSuccess(''); }}
                    className={`pb-3 text-sm font-semibold relative transition-colors ${!isSignUp ? 'text-primary' : 'text-text-tertiary hover:text-text-secondary'}`}
                  >
                    Sign In
                    {!isSignUp && (
                      <motion.div layoutId="auth-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                    )}
                  </button>
                  <button
                    onClick={() => { setIsSignUp(true); setError(''); setSuccess(''); }}
                    className={`pb-3 text-sm font-semibold relative transition-colors ${isSignUp ? 'text-primary' : 'text-text-tertiary hover:text-text-secondary'}`}
                  >
                    Sign Up
                    {isSignUp && (
                      <motion.div layoutId="auth-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                    )}
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {isSignUp && (
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full Name"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl glass border border-border text-text-primary text-sm focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  )}

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl glass border border-border text-text-primary text-sm focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl glass border border-border text-text-primary text-sm focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  {!isSignUp && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setIsResetting(true)}
                        className="text-xs text-text-tertiary hover:text-primary transition-colors font-medium"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full btn-primary py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm shadow-md"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {isSignUp ? 'Sign Up' : 'Sign In'}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3 my-6">
                  <div className="h-px bg-border flex-1" />
                  <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider">or continue with</span>
                  <div className="h-px bg-border flex-1" />
                </div>

                {/* OAuth Buttons */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button
                    onClick={() => setOauthProvider('google')}
                    className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl glass border border-border hover:border-primary/30 text-xs font-semibold text-text-secondary hover:text-text-primary transition-all"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                    Google
                  </button>
                  <button
                    onClick={() => setOauthProvider('apple')}
                    className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl glass border border-border hover:border-primary/30 text-xs font-semibold text-text-secondary hover:text-text-primary transition-all"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.23.67-2.95 1.51-.62.71-1.16 1.85-1.01 2.96 1.12.09 2.27-.58 2.97-1.41z"/>
                    </svg>
                    Apple
                  </button>
                </div>

                {/* Guest Mode Trigger */}
                <button
                  onClick={handleGuest}
                  className="w-full text-center py-2 text-xs font-semibold text-primary hover:underline transition-colors mt-2"
                >
                  Continue as Guest (Try without account)
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Simulated OAuth Overlay Dialog */}
      <AnimatePresence>
        {oauthProvider && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm glass-card p-6 border-primary/20 shadow-glow"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-text-primary flex items-center gap-1.5">
                  {oauthProvider === 'google' ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.23.67-2.95 1.51-.62.71-1.16 1.85-1.01 2.96 1.12.09 2.27-.58 2.97-1.41z"/>
                    </svg>
                  )}
                  Sign In via {oauthProvider === 'google' ? 'Google' : 'Apple'}
                </h3>
                <button onClick={() => setOauthProvider(null)} className="p-1 hover:bg-bg-secondary rounded-lg text-text-tertiary hover:text-text-primary">
                  <AlertCircle className="w-4 h-4 rotate-45" />
                </button>
              </div>
              <p className="text-xs text-text-tertiary mb-4">
                Select an account to authorize access to TranslateGPT:
              </p>
              
              <div className="space-y-2">
                {[
                  { name: 'Shruti Yadav', email: 'shrutiyadav@gmail.com' },
                  { name: 'Test Account', email: 'tester@translategpt.local' }
                ].map((account) => (
                  <button
                    key={account.email}
                    onClick={() => handleOAuthLogin(oauthProvider, account.email, account.name)}
                    className="w-full flex items-start gap-3 p-3 rounded-xl glass border border-border hover:bg-primary/5 hover:border-primary/30 text-left transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                      {account.name[0]}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-primary">{account.name}</p>
                      <p className="text-[10px] text-text-tertiary">{account.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
