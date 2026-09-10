import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { User, Mail, Lock, Layers, ArrowRight, ShieldCheck, UserPlus, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { ErrorMessage } from '../components/ErrorMessage';
import { projectService } from '../services/projectService';

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const inviteProject = searchParams.get('invite_project');
  const prefilledEmail = searchParams.get('email') || '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isJoiningExisting, setIsJoiningExisting] = useState(false);

  const { user, isAuthenticated, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }
  }, [prefilledEmail]);

  // If already logged in and has inviteProject, provide instant join
  const handleExistingUserJoin = async () => {
    if (!inviteProject) return;
    setIsJoiningExisting(true);
    try {
      await projectService.joinProject(inviteProject);
      navigate(`/projects/${inviteProject}`, { replace: true });
    } catch (err: any) {
      console.warn('Auto join error:', err);
      navigate(`/projects/${inviteProject}`, { replace: true });
    } finally {
      setIsJoiningExisting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await register(
        name.trim(),
        email.trim().toLowerCase(),
        password,
        confirmPassword,
        inviteProject ? Number(inviteProject) : undefined
      );
      if (inviteProject) {
        navigate(`/projects/${inviteProject}`, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isEmailAlreadyRegistered = error && (error.toLowerCase().includes('already') || error.toLowerCase().includes('registered') || error.toLowerCase().includes('exists'));

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
          Create your account
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Already registered?{' '}
          <Link
            to={inviteProject ? `/login?invite_project=${inviteProject}${email ? `&email=${encodeURIComponent(email)}` : ''}` : '/login'}
            className="font-semibold text-orange-400 hover:text-orange-300 transition-colors"
          >
            Sign in to existing workspace
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-900/90 border border-slate-800 py-8 px-6 sm:px-10 rounded-2xl shadow-xl space-y-6">
          {isAuthenticated && user && inviteProject ? (
            <div className="space-y-4 text-center">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-left flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-emerald-300 text-sm">Already Signed In</div>
                  <div className="text-xs text-slate-300 mt-1">
                    You are currently signed in as <span className="font-semibold text-white">{user.name}</span> ({user.email}).
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-300">
                Click below to accept the invitation and jump straight to Project #{inviteProject}.
              </p>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={isJoiningExisting}
                onClick={handleExistingUserJoin}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Accept Invite & Open Project
              </Button>
            </div>
          ) : (
            <>
              {inviteProject && (
                <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center gap-3 text-orange-300 text-xs">
                  <UserPlus className="w-5 h-5 shrink-0 text-orange-400" />
                  <span>You've been invited to project #{inviteProject}. Register below to join immediately!</span>
                </div>
              )}

              {error && (
                <div className="space-y-2">
                  <ErrorMessage message={error} />
                  {isEmailAlreadyRegistered && (
                    <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300 flex items-center justify-between gap-2">
                      <span>Already have an account with this email?</span>
                      <Link
                        to={`/login?invite_project=${inviteProject || ''}&email=${encodeURIComponent(email)}`}
                        className="font-semibold text-orange-400 hover:underline shrink-0"
                      >
                        Sign in now →
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="e.g. Rachel Adams"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  leftIcon={<User className="w-4 h-4" />}
                  required
                  autoFocus={!prefilledEmail}
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="rachel@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                  autoFocus={!!prefilledEmail}
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<ShieldCheck className="w-4 h-4" />}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  {inviteProject ? 'Register & Join Project' : 'Register & Get Started'}
                </Button>
              </form>

              <p className="text-center text-xs text-slate-400">
                By registering, passwords are automatically encrypted via bcrypt with 10 salt rounds.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
