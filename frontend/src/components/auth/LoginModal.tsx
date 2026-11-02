import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import Logo from '../brand/Logo';
import { API_BASE_URL } from '../../config/env';

/**
 * LoginModalProps — Clean props for the production LoginModal
 */
export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * LoginModal Component — Production Google OAuth Gateway
 * Grounded in: karta_design_system.md and karta_security.md Layer 1
 *
 * NOTE:
 * End users only see the official Google authentication method.
 * Admin elevation happens strictly server-side through ADMIN_EMAILS in the backend,
 * ensuring zero administrative bypasses or leaked admin controls in client code.
 */
export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press or outside click
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Direct URL to backend Google OAuth initiation endpoint
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/v1/auth/google/login`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Dialog Card */}
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-white rounded-3xl border border-border shadow-2xl p-6 sm:p-8 overflow-hidden select-none animate-in zoom-in-95 duration-150"
      >
        {/* Soft green ambient accent at top right */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-karta-100 rounded-full blur-2xl pointer-events-none -z-10" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-muted hover:text-ink hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header: Brand Logo & Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3">
            <Logo size="lg" />
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight mb-1">
            Welcome to Karta
          </h3>

          <p className="text-xs sm:text-sm text-muted max-w-xs leading-relaxed">
            Visual thinking for developers. Sign in with Google to design schemas, collaborate live, and save diagrams.
          </p>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Primary Action: Official Continue with Google Button          */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-gray-50 active:bg-gray-100 text-ink font-semibold text-sm rounded-xl border border-border shadow-xs hover:shadow-card hover:border-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-karta-300 cursor-pointer"
          >
            {/* Google 4-Color SVG Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Terms & Privacy Footnote */}
        <p className="text-center text-[11px] text-muted leading-relaxed pt-2">
          By continuing, you agree to Karta's{' '}
          <span className="underline hover:text-ink cursor-pointer transition-colors">Terms of Service</span>{' '}
          and{' '}
          <span className="underline hover:text-ink cursor-pointer transition-colors">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
};

export default LoginModal;
