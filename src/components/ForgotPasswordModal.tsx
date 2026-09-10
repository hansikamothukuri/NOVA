import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  KeyRound,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { ErrorMessage } from './ErrorMessage';
import { authService } from '../services/authService';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onPasswordResetSuccess?: (email: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
  onPasswordResetSuccess,
}) => {
  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Simulated code helper for testing
  const [receivedCode, setReceivedCode] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail || '');
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
      setStep('request');
      setError(null);
      setSuccessMessage(null);
      setReceivedCode(null);
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen, initialEmail]);

  // Step 1: Request reset code
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid work email address.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await authService.forgotPassword(email.trim().toLowerCase());
      setSuccessMessage(res.message || 'Verification code generated successfully.');
      if (res.data?.code) {
        setReceivedCode(res.data.code);
        setCode(res.data.code); // Auto-fill for instant convenience
      }
      setStep('reset');
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to request password reset code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit verification code and set new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await authService.resetPassword({
        email: email.trim().toLowerCase(),
        code: code.trim(),
        newPassword,
        confirmPassword,
      });
      setSuccessMessage(res.message || 'Password reset successfully!');
      setStep('success');
      if (onPasswordResetSuccess) {
        onPasswordResetSuccess(email.trim().toLowerCase());
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to reset password. Please check your verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    if (onPasswordResetSuccess) {
      onPasswordResetSuccess(email.trim().toLowerCase());
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        step === 'request'
          ? 'Reset Your Password'
          : step === 'reset'
          ? 'Enter Code & New Password'
          : 'Password Reset Successful'
      }
      subtitle={
        step === 'request'
          ? 'Enter your registered email to receive a secure password reset verification code.'
          : step === 'reset'
          ? `We generated a verification code for ${email}.`
          : 'Your account credentials have been securely updated.'
      }
      maxWidth="md"
    >
      <div className="space-y-4">
        {error && <ErrorMessage message={error} />}

        {/* STEP 1: Request code */}
        {step === 'request' && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <Input
              id="forgot-email-input"
              label="Work Email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
              autoFocus
              helperText="We will check our system for your account and issue a reset code."
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button
                id="cancel-forgot-modal-btn"
                variant="secondary"
                type="button"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                id="send-reset-code-btn"
                variant="primary"
                type="submit"
                loading={loading}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Send Verification Code
              </Button>
            </div>
          </form>
        )}

        {/* STEP 2: Enter code & new password */}
        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {receivedCode && (
              <div className="bg-orange-950/40 border border-orange-500/40 rounded-xl p-3.5 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-semibold text-orange-300">
                    Verification Code Generated: <span className="font-mono text-sm tracking-widest text-white bg-orange-900/60 px-2 py-0.5 rounded ml-1">{receivedCode}</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    In this preview environment, your code is pre-filled below for instant testing.
                  </p>
                </div>
              </div>
            )}

            {/* 6-digit Code Input */}
            <Input
              id="reset-code-input"
              label="6-Digit Verification Code"
              type="text"
              placeholder="e.g., 492018"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              leftIcon={<KeyRound className="w-4 h-4" />}
              required
              maxLength={6}
              autoFocus
            />

            {/* New Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="new-password-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  New Password
                </label>
                <span className="text-[10px] text-slate-400">Min. 6 characters</span>
              </div>
              <div className="relative">
                <Input
                  id="new-password-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  required
                />
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label
                htmlFor="confirm-new-password-input"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <Input
                  id="confirm-new-password-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<ShieldCheck className="w-4 h-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep('request')}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-orange-400 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Resend / change email</span>
              </button>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  id="submit-new-password-btn"
                  variant="primary"
                  type="submit"
                  loading={loading}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Set New Password
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* STEP 3: Success Confirmation */}
        {step === 'success' && (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-100">
                Password Successfully Reset!
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Your password has been updated for <strong className="text-slate-200">{email}</strong>. You can now log into your account with your new password.
              </p>
            </div>

            <div className="pt-2">
              <Button
                id="finish-reset-btn"
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleFinish}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Back to Sign In
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
