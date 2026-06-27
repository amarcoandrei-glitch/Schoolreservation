import { useState } from 'react';
import { motion } from 'motion/react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import {
  Package,
  CheckCircle,
  BarChart3,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  Mail,
  LockKeyhole,
  ArrowRight,
  Tool,
} from 'lucide-react';
import { loginUser } from '../../../lib/authService';

interface ModernLoginPageProps {
  onLogin: (email: string, password: string, role: string, name?: string) => void;
  onSwitchToRegister: () => void;
}

export function ModernLoginPage({ onLogin, onSwitchToRegister }: ModernLoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const profile = await loginUser(email, password);
      onLogin(email, password, profile.role, profile.name);
    } catch (err: any) {
      const msg =
        err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
          ? 'Invalid email or password.'
          : err.code === 'auth/user-not-found'
          ? 'No account found with this email.'
          : err.code === 'auth/too-many-requests'
          ? 'Too many attempts. Please try again later.'
          : err.message || 'Sign in failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Package,
      title: 'Equipment tracking',
      description: 'Monitor every device, lab tool, and asset in real time.',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: CheckCircle,
      title: 'Faster approvals',
      description: 'Keep reservations moving with a smoother workflow.',
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      icon: BarChart3,
      title: 'Helpful insights',
      description: 'Spot usage trends and plan smarter across departments.',
      color: 'from-violet-500 to-purple-600',
    },
  ];

  return (
    <div className="min-h-screen flex bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_34%),linear-gradient(135deg,_#f8fbff_0%,_#eef5ff_100%)]">
      <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.16),_transparent_28%)]" />
        <div className="absolute -top-20 left-10 h-56 w-56 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center px-10 xl:px-16 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Trusted by modern university teams
            </div>

            <div className="mt-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-lg shadow-blue-950/20">
                <Tool className="h-7 w-7" />
              </div>
              <span className="text-3xl font-semibold tracking-tight">EquipHub</span>
            </div>

            <h1 className="mt-8 text-5xl font-semibold leading-tight tracking-tight">
              Manage equipment<br />with clarity.
            </h1>

            <p className="mt-5 max-w-md text-lg leading-8 text-blue-100">
              A polished platform for reservations, inventory oversight, and smooth collaboration across campus.
            </p>

            <div className="mt-10 space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                  className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md transition-all hover:bg-white/15"
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color}`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">{feature.title}</h3>
                      <p className="mt-1 text-sm text-blue-100">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-transparent p-6 sm:p-8 lg:p-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-8 shadow-[0_20px_80px_-24px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:p-8">
            <div className="lg:hidden mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[--primary-blue] text-white">
                <Package className="h-6 w-6" />
              </div>
              <span className="text-2xl font-semibold text-[--foreground]">EquipHub</span>
            </div>

            <div className="mb-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                <Tool className="h-4 w-4" />
                Equipment access
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-[--foreground]">Welcome back</h2>
              <p className="mt-2 text-[--muted-foreground]">
                Sign in to continue managing reservations, inventory, and approvals.
              </p>
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-[42px] h-4 w-4 -translate-y-1/2 text-[--muted-foreground]" />
                  <Input
                    type="email"
                    label="Email Address"
                    placeholder="your.email@university.edu"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    required
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50/80 pl-10"
                  />
                </div>

                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-[42px] h-4 w-4 -translate-y-1/2 text-[--muted-foreground]" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    label="Password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    required
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50/80 pl-10 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[42px] -translate-y-1/2 text-[--muted-foreground] transition-colors hover:text-[--foreground]"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-[--border] text-[--primary-blue] focus:ring-2 focus:ring-[--primary-blue]"
                    />
                    <span className="text-sm text-[--foreground]">Remember me</span>
                  </label>
                  <a href="#forgot" className="text-sm font-medium text-[--primary-blue] transition-colors hover:underline">
                    Forgot password?
                  </a>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                variant="primary"
                size="lg"
                className="h-12 w-full rounded-2xl text-base font-semibold shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/35"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>

              <div className="text-center text-sm text-[--muted-foreground]">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="font-medium text-[--primary-blue] transition-colors hover:underline"
                >
                  Create an account
                </button>
              </div>
            </form>

            <div className="mt-8 border-t border-[--border] pt-6">
              <p className="text-center text-xs text-[--muted-foreground]">
                © 2024 University Equipment Management System
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
