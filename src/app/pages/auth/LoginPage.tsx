import { useState } from 'react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Package } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, password: string, role: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'faculty' | 'admin'>('student');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password, role);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[--primary-blue] rounded-2xl mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[--foreground] mb-2">Welcome to EquipHub</h1>
          <p className="text-[--muted-foreground]">
            Sign in to manage your equipment reservations
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 p-1 bg-[--secondary] rounded-lg">
                {(['student', 'faculty', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 px-3 rounded-md text-sm font-medium transition-all capitalize ${
                      role === r
                        ? 'bg-white text-[--foreground] shadow-sm'
                        : 'text-[--muted-foreground] hover:text-[--foreground]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <Input
                type="email"
                label="Email Address"
                placeholder="your.email@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                type="password"
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-[--primary-blue] rounded" />
                  <span className="text-[--foreground]">Remember me</span>
                </label>
                <a href="#forgot" className="text-[--primary-blue] hover:underline font-medium">
                  Forgot password?
                </a>
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full">
              Sign In
            </Button>

            <div className="text-center text-sm text-[--muted-foreground]">
              Don't have an account?{' '}
              <a href="#register" className="text-[--primary-blue] hover:underline font-medium">
                Create an account
              </a>
            </div>
          </form>
        </div>

        <p className="text-center text-sm text-[--muted-foreground] mt-6">
          &copy; 2024 University Equipment Management System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
