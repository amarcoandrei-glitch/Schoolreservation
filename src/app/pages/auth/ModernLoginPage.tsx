import { useState } from 'react';
import { motion } from 'motion/react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Package, CheckCircle, BarChart3, Users, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
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
      title: 'Equipment Tracking',
      description: 'Track all university equipment in real-time',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: CheckCircle,
      title: 'Reservation Approval',
      description: 'Streamlined approval workflow',
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      icon: BarChart3,
      title: 'Inventory Analytics',
      description: 'Comprehensive usage insights',
      color: 'from-purple-500 to-purple-600',
    },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <Package className="w-7 h-7 text-blue-600" />
              </div>
              <span className="text-3xl font-bold">EquipHub</span>
            </div>

            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Manage Equipment<br />Smarter
            </h1>

            <p className="text-xl text-blue-100 mb-12 max-w-md">
              Your university's complete equipment reservation and inventory management platform
            </p>

            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                      <p className="text-blue-100 text-sm">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[--background]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[--primary-blue] rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[--foreground]">EquipHub</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[--foreground] mb-2">Welcome back</h2>
            <p className="text-[--muted-foreground]">Sign in to manage your equipment reservations</p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 p-3.5 mb-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div className="relative">
                <Input
                  type="email"
                  label="Email Address"
                  placeholder="your.email@university.edu"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  required
                  className="h-12"
                />
              </div>

              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  required
                  className="h-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-[--muted-foreground] hover:text-[--foreground] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[--primary-blue] rounded border-[--border] focus:ring-2 focus:ring-[--primary-blue]"
                  />
                  <span className="text-sm text-[--foreground]">Remember me</span>
                </label>
                <a
                  href="#forgot"
                  className="text-sm text-[--primary-blue] hover:underline font-medium"
                >
                  Forgot password?
                </a>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              size="lg"
              className="w-full h-12 text-base font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign In'}
            </Button>

            <div className="text-center text-sm text-[--muted-foreground]">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-[--primary-blue] hover:underline font-medium"
              >
                Create an account
              </button>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-[--border]">
            <p className="text-xs text-center text-[--muted-foreground]">
              © 2024 University Equipment Management System
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
