import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Package,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  UserPlus,
  BookOpen,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Building2,
} from 'lucide-react';
import { registerUser, createAdminUser, type UserRole } from '../../../lib/authService';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
  onRegisterSuccess: (role: UserRole, name: string) => void;
}

// Change this to any secret code you want to protect admin registration
const ADMIN_SECRET_CODE = 'EQUIPHUB-ADMIN-2024';

const DEPARTMENTS = [
  { value: 'CECE', label: 'CECE – College of Engineering & Computer Education' },
  { value: 'Ctelan', label: 'Ctelan – College of Teacher Education, Liberal Arts & Nursing' },
  { value: 'CBA', label: 'CBA – College of Business & Accountancy' },
];

function generateId(prefix: string) {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}-${rand}`;
}

type RoleTab = 'student' | 'faculty' | 'admin';

export function RegisterPage({ onSwitchToLogin, onRegisterSuccess }: RegisterPageProps) {
  const [tab, setTab] = useState<RoleTab>('student');
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    studentId: '',
    department: '',
    password: '',
    confirmPassword: '',
    adminCode: '',
    agreed: false,
  });

  const set = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value =
      e.target.type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const idLabel = tab === 'student' ? 'Student ID' : tab === 'faculty' ? 'Faculty ID' : 'Employee ID';
  const isAutoId = tab === 'faculty' || tab === 'admin';

  const validateStep1 = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return 'First and last name are required.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return 'Please enter a valid email address.';
    if (!isAutoId && !form.studentId.trim()) return 'Student ID is required.';
    if (!form.department) return 'Please select a department.';
    if (tab === 'admin') {
      if (!form.adminCode.trim()) return 'Admin registration code is required.';
      if (form.adminCode.trim() !== ADMIN_SECRET_CODE)
        return 'Invalid admin registration code. Contact your system administrator.';
    }
    return null;
  };

  const validateStep2 = () => {
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    if (!form.agreed) return 'You must agree to the Terms of Service.';
    return null;
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError(null);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep2();
    if (err) { setError(err); return; }

    setLoading(true);
    setError(null);
    try {
      const fullName = `${form.firstName} ${form.lastName}`;
      if (tab === 'admin') {
        await createAdminUser({
          email: form.email,
          password: form.password,
          name: fullName,
        });
        // createAdminUser signs out after creation — we sign back in via onRegisterSuccess
        setSuccess(true);
        setTimeout(() => onRegisterSuccess('admin', fullName), 2000);
      } else {
        await registerUser({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          role: tab,
          department: form.department,
          studentId: form.studentId,
        });
        setSuccess(true);
        setTimeout(() => onRegisterSuccess(tab, fullName), 2000);
      }
    } catch (e: any) {
      const msg =
        e.code === 'auth/email-already-in-use'
          ? 'An account with this email already exists.'
          : e.code === 'auth/invalid-email'
          ? 'Invalid email address.'
          : e.code === 'auth/weak-password'
          ? 'Password is too weak. Use at least 8 characters.'
          : e.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (t: RoleTab) => {
    setTab(t);
    setStep(1);
    setError(null);
    setForm((f) => ({
      ...f,
      adminCode: '',
      department: t === 'admin' ? 'Administration' : '',
      studentId: t === 'faculty' ? generateId('FAC') : t === 'admin' ? generateId('ADM') : '',
    }));
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-md w-full"
        >
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${tab === 'admin' ? 'bg-blue-100' : 'bg-emerald-100'}`}>
            {tab === 'admin'
              ? <ShieldCheck className="w-10 h-10 text-blue-600" />
              : <CheckCircle className="w-10 h-10 text-emerald-600" />
            }
          </div>
          <h2 className="text-2xl font-bold text-[--foreground] mb-2">Account Created!</h2>
          <p className="text-[--muted-foreground] mb-1">
            Welcome to EquipHub, {form.firstName}!
          </p>
          <p className="text-sm text-[--muted-foreground] mb-6">
            Registered as <span className="font-semibold capitalize text-[--foreground]">{tab}</span>. Redirecting…
          </p>
          <Loader2 className="w-5 h-5 animate-spin text-blue-600 mx-auto" />
        </motion.div>
      </div>
    );
  }

  const tabConfig = [
    { key: 'student' as RoleTab, label: 'Student', icon: GraduationCap, desc: 'Undergraduate / Graduate' },
    { key: 'faculty' as RoleTab, label: 'Faculty', icon: BookOpen, desc: 'Lecturer / Professor' },
    { key: 'admin' as RoleTab, label: 'Admin', icon: ShieldCheck, desc: 'System Administrator' },
  ];

  const leftPanelConfig = {
    student: {
      gradient: 'from-blue-600 via-blue-700 to-indigo-800',
      title: 'Start Reserving Equipment Today',
      subtitle: 'Get instant access to thousands of university equipment items.',
      points: [
        { icon: GraduationCap, text: '7-day loan periods for students' },
        { icon: CheckCircle, text: 'Real-time availability tracking' },
        { icon: Package, text: 'Browse & reserve in seconds' },
      ],
    },
    faculty: {
      gradient: 'from-emerald-600 via-teal-700 to-cyan-800',
      title: 'Manage Your Course Equipment',
      subtitle: 'Priority booking and dedicated support for faculty needs.',
      points: [
        { icon: BookOpen, text: 'Priority booking for course needs' },
        { icon: CheckCircle, text: 'Approve student requests easily' },
        { icon: Package, text: 'Extended loan periods for faculty' },
      ],
    },
    admin: {
      gradient: 'from-slate-700 via-slate-800 to-gray-900',
      title: 'Administer the EquipHub System',
      subtitle: 'Full control over inventory, users, and reservations.',
      points: [
        { icon: ShieldCheck, text: 'Full system access & control' },
        { icon: Building2, text: 'Manage all departments & users' },
        { icon: KeyRound, text: 'Approve reservations & reports' },
      ],
    },
  };

  const panel = leftPanelConfig[tab];

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className={`hidden lg:flex lg:w-5/12 bg-gradient-to-br ${panel.gradient} relative overflow-hidden flex-col justify-center px-14 text-white transition-all duration-500`}>
        <div className="absolute top-0 left-0 w-80 h-80 bg-white rounded-full mix-blend-multiply filter blur-3xl opacity-5" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white rounded-full mix-blend-multiply filter blur-3xl opacity-5" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <Package className="w-7 h-7 text-blue-600" />
            </div>
            <span className="text-3xl font-bold">EquipHub</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-4xl font-bold mb-4 leading-tight">{panel.title}</h1>
              <p className="text-white/70 text-lg mb-10">{panel.subtitle}</p>
              <div className="space-y-4">
                {panel.points.map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-center gap-3 text-white/80">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm">{text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[--background] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg py-8"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[--primary-blue] rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[--foreground]">EquipHub</span>
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-bold text-[--foreground] mb-1.5">Create your account</h2>
            <p className="text-[--muted-foreground]">Choose your role and fill in your details below</p>
          </div>

          {/* Role tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-7">
            {tabConfig.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleTabChange(key)}
                className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  tab === key
                    ? key === 'admin'
                      ? 'bg-slate-800 text-white shadow-md'
                      : 'bg-white text-[--foreground] shadow-md'
                    : 'text-[--muted-foreground] hover:text-[--foreground]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {key === 'admin' && (
                  <span className="absolute -top-1.5 -right-1 bg-amber-400 text-amber-900 text-[9px] font-bold px-1 rounded-full leading-4">
                    CODE
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Admin notice */}
          {tab === 'admin' && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl mb-5"
            >
              <ShieldCheck className="w-5 h-5 text-slate-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-800">Admin Registration</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Requires a secret admin code provided by your system administrator.
                  Admin accounts have full access to inventory, users, and approvals.
                </p>
              </div>
            </motion.div>
          )}

          {/* Progress steps */}
          <div className="flex items-center gap-3 mb-6">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  step === s
                    ? tab === 'admin' ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white'
                    : step > s
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-[--muted-foreground]'
                }`}>
                  {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                </div>
                <span className={`text-sm ${step === s ? 'text-[--foreground] font-medium' : 'text-[--muted-foreground]'}`}>
                  {s === 1 ? 'Your Info' : 'Set Password'}
                </span>
                {s < 2 && <div className={`h-px w-8 ${step > 1 ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 mb-5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[--foreground] mb-1.5">First Name</label>
                    <input
                      className="w-full border border-[--border] rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="John"
                      value={form.firstName}
                      onChange={set('firstName')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[--foreground] mb-1.5">Last Name</label>
                    <input
                      className="w-full border border-[--border] rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Doe"
                      value={form.lastName}
                      onChange={set('lastName')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[--foreground] mb-1.5">Email Address</label>
                  <input
                    type="email"
                    className="w-full border border-[--border] rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder={tab === 'admin' ? 'admin@university.edu' : 'john.doe@university.edu'}
                    value={form.email}
                    onChange={set('email')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[--foreground] mb-1.5">
                      {idLabel}
                      {isAutoId && (
                        <span className="ml-1.5 text-xs text-emerald-600 font-normal">Auto-assigned</span>
                      )}
                    </label>
                    {isAutoId ? (
                      <div className="w-full border border-emerald-200 bg-emerald-50 rounded-xl px-4 py-2.5 text-sm text-emerald-800 font-mono flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        {form.studentId}
                      </div>
                    ) : (
                      <input
                        className="w-full border border-[--border] rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="2024001234"
                        value={form.studentId}
                        onChange={set('studentId')}
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[--foreground] mb-1.5">College / Department</label>
                    <select
                      className="w-full border border-[--border] rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={form.department}
                      onChange={set('department')}
                    >
                      <option value="">Select…</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Admin code field */}
                {tab === 'admin' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-sm font-medium text-[--foreground] mb-1.5">
                      Admin Registration Code
                      <span className="ml-1.5 text-xs text-amber-600 font-normal">(required)</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--muted-foreground]" />
                      <input
                        type={showAdminCode ? 'text' : 'password'}
                        className="w-full border border-amber-300 bg-amber-50 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
                        placeholder="Enter the admin secret code"
                        value={form.adminCode}
                        onChange={set('adminCode')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminCode((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[--muted-foreground] hover:text-[--foreground]"
                      >
                        {showAdminCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-[--muted-foreground] mt-1">
                      Contact your system administrator to obtain this code.
                    </p>
                  </motion.div>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  className={`w-full flex items-center justify-center gap-2 py-3 text-white rounded-xl font-medium transition-colors shadow-lg ${
                    tab === 'admin'
                      ? 'bg-slate-800 hover:bg-slate-900 shadow-slate-500/20'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                  }`}
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-[--foreground] mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full border border-[--border] rounded-xl px-4 py-2.5 text-sm bg-white pr-11 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="At least 8 characters"
                      value={form.password}
                      onChange={set('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[--muted-foreground] hover:text-[--foreground]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.password && <PasswordStrength password={form.password} />}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[--foreground] mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm bg-white pr-11 focus:outline-none focus:ring-2 transition-colors ${
                        form.confirmPassword && form.confirmPassword !== form.password
                          ? 'border-red-400 focus:ring-red-500/20'
                          : 'border-[--border] focus:ring-blue-500/20 focus:border-blue-500'
                      }`}
                      placeholder="Re-enter your password"
                      value={form.confirmPassword}
                      onChange={set('confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[--muted-foreground] hover:text-[--foreground]"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>

                {/* Summary box */}
                <div className="p-4 bg-gray-50 rounded-xl border border-[--border] text-sm space-y-1.5">
                  <p className="font-medium text-[--foreground] mb-2">Account summary</p>
                  <div className="flex justify-between text-[--muted-foreground]">
                    <span>Name</span>
                    <span className="text-[--foreground] font-medium">{form.firstName} {form.lastName}</span>
                  </div>
                  <div className="flex justify-between text-[--muted-foreground]">
                    <span>Email</span>
                    <span className="text-[--foreground]">{form.email}</span>
                  </div>
                  <div className="flex justify-between text-[--muted-foreground]">
                    <span>Role</span>
                    <span className={`font-semibold capitalize ${tab === 'admin' ? 'text-slate-700' : 'text-blue-600'}`}>{tab}</span>
                  </div>
                  <div className="flex justify-between text-[--muted-foreground]">
                    <span>Department</span>
                    <span className="text-[--foreground]">
                      {DEPARTMENTS.find(d => d.value === form.department)?.value || form.department || '—'}
                    </span>
                  </div>
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 mt-0.5 text-blue-600 rounded border-[--border]"
                    checked={form.agreed}
                    onChange={set('agreed')}
                  />
                  <span className="text-sm text-[--foreground]">
                    I agree to the{' '}
                    <span className="text-blue-600 hover:underline cursor-pointer">Terms of Service</span>
                    {' '}and{' '}
                    <span className="text-blue-600 hover:underline cursor-pointer">Privacy Policy</span>
                  </span>
                </label>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(null); }}
                    className="px-5 py-3 border border-[--border] rounded-xl text-sm text-[--muted-foreground] hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-white rounded-xl font-medium disabled:opacity-60 transition-colors shadow-lg ${
                      tab === 'admin'
                        ? 'bg-slate-800 hover:bg-slate-900 shadow-slate-500/20'
                        : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                    }`}
                  >
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
                      : <><UserPlus className="w-4 h-4" /> Create {tab === 'admin' ? 'Admin' : ''} Account</>
                    }
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="text-center text-sm text-[--muted-foreground] mt-6">
            Already have an account?{' '}
            <button onClick={onSwitchToLogin} className="text-blue-600 hover:underline font-medium">
              Sign in
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const label = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][score];
  const colors = ['bg-red-400', 'bg-red-400', 'bg-amber-400', 'bg-yellow-400', 'bg-emerald-500'];
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < score ? colors[score] : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className={`text-xs ${score >= 3 ? 'text-emerald-600' : score >= 2 ? 'text-amber-600' : 'text-red-500'}`}>
        {label}
      </p>
    </div>
  );
}
