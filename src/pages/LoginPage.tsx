import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Layers, ArrowRight, Zap, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { ErrorMessage } from '../components/ErrorMessage';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Forgot password modal state
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const from = (location.state as any)?.from?.pathname || '/dashboard';
  const inviteProject = searchParams.get('invite_project');

  useEffect(() => {
    const prefillEmail = searchParams.get('email');
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
    if (searchParams.get('expired') === 'true') {
      setError('Your session has expired. Please sign in again.');
    } else if (searchParams.get('registered') === 'true') {
      setSuccessBanner('Account created successfully! Please sign in with your credentials.');
    }
    if (searchParams.get('forgot') === 'true') {
      setIsForgotPasswordOpen(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(email.trim().toLowerCase(), password);
      if (inviteProject) {
        try {
          const { projectService } = await import('../services/projectService');
          await projectService.joinProject(inviteProject);
        } catch (joinErr) {
          console.warn('Could not auto-join project on login:', joinErr);
        }
        navigate(`/projects/${inviteProject}`, { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoUser = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError(null);
    setSuccessBanner(null);
  };

  const handlePasswordResetSuccess = (resetEmail: string) => {
    setEmail(resetEmail);
    setPassword('');
    setSuccessBanner('Password reset successfully! Please sign in with your new password.');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 group mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-950/60 group-hover:scale-105 transition-transform">
            <Layers className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">NOVA</span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Or{' '}
          <Link
            to={inviteProject ? `/register?invite_project=${inviteProject}${email ? `&email=${encodeURIComponent(email)}` : ''}` : '/register'}
            className="font-semibold text-orange-400 hover:text-orange-300 transition-colors"
          >
            create a new team member account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-900/90 border border-slate-800 py-8 px-6 sm:px-10 rounded-2xl shadow-xl space-y-6">
          {inviteProject && (
            <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center gap-3 text-orange-300 text-xs">
              <span className="font-semibold">Project Invite:</span>
              <span>Sign in to accept and immediately access project #{inviteProject}.</span>
            </div>
          )}

          {error && <ErrorMessage message={error} />}

          {successBanner && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successBanner}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="login-email-input"
              label="Work Email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
              autoFocus
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Password
                </label>
                <button
                  id="forgot-password-link-btn"
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <Input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer"
                      tabIndex={-1}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  required
                />
              </div>
            </div>

            <Button
              id="login-submit-btn"
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Login Preset Pills */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Login Accounts (Password: password123)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                id="quick-login-hansika-btn"
                type="button"
                onClick={() => fillDemoUser('hansikamothukuri23@gmail.com')}
                className="text-left p-2 rounded-lg bg-orange-950/40 border border-orange-500/40 hover:border-orange-400 hover:bg-orange-900/30 text-xs transition-colors cursor-pointer"
              >
                <div className="font-semibold text-orange-300">Hansika</div>
                <div className="text-[10px] text-slate-400 truncate">hansikamothukuri23@gmail.com</div>
              </button>
              <button
                id="quick-login-alex-btn"
                type="button"
                onClick={() => fillDemoUser('alex@nova.dev')}
                className="text-left p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-orange-500/50 hover:bg-slate-800/40 text-xs transition-colors cursor-pointer"
              >
                <div className="font-semibold text-slate-200">Alex Johnson</div>
                <div className="text-[10px] text-slate-400">alex@nova.dev (Lead)</div>
              </button>
              <button
                id="quick-login-sarah-btn"
                type="button"
                onClick={() => fillDemoUser('sarah@nova.dev')}
                className="text-left p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-orange-500/50 hover:bg-slate-800/40 text-xs transition-colors cursor-pointer"
              >
                <div className="font-semibold text-slate-200">Sarah Williams</div>
                <div className="text-[10px] text-slate-400">sarah@nova.dev (Frontend)</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        initialEmail={email}
        onPasswordResetSuccess={handlePasswordResetSuccess}
      />
    </div>
  );
};
