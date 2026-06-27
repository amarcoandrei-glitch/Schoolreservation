import { useState } from 'react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Package, Mail, CheckCircle } from 'lucide-react';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-[--success]" />
            </div>
            <h2 className="text-2xl font-bold text-[--foreground] mb-2">Check Your Email</h2>
            <p className="text-[--muted-foreground] mb-6">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-[--muted-foreground] mb-6">
              Click the link in the email to reset your password. The link will expire in 24
              hours.
            </p>
            <Button variant="primary" className="w-full" onClick={() => setSubmitted(false)}>
              Back to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[--primary-blue] rounded-2xl mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[--foreground] mb-2">Reset Password</h1>
          <p className="text-[--muted-foreground]">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Mail className="w-5 h-5 text-[--primary-blue]" />
              <p className="text-sm text-[--foreground]">
                We'll email you instructions to reset your password
              </p>
            </div>

            <Input
              type="email"
              label="Email Address"
              placeholder="your.email@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button type="submit" variant="primary" size="lg" className="w-full">
              Send Reset Link
            </Button>

            <div className="text-center text-sm text-[--muted-foreground]">
              Remember your password?{' '}
              <a href="#login" className="text-[--primary-blue] hover:underline font-medium">
                Sign in
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
