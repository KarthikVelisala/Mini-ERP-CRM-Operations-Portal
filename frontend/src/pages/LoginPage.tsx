import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Boxes, ScrollText, Users } from 'lucide-react';
import { ApiRequestError } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { TextInput } from '../components/ui/Form';
import { InlineError } from '../components/ui/States';
import type { Role } from '../types/api';

const DEMO_ACCOUNTS: Array<{ role: Role; email: string; description: string }> = [
  { role: 'ADMIN', email: 'admin@minierp.com', description: 'Full access to every module' },
  { role: 'SALES', email: 'sales@minierp.com', description: 'Customers and sales challans' },
  { role: 'WAREHOUSE', email: 'warehouse@minierp.com', description: 'Products and stock' },
  { role: 'ACCOUNTS', email: 'accounts@minierp.com', description: 'Read-only across the portal' },
];

const DEMO_PASSWORD = 'Password@123';

const HIGHLIGHTS = [
  { icon: Users, label: 'Customer CRM', detail: 'Leads, follow-ups and account history' },
  { icon: Boxes, label: 'Live inventory', detail: 'Stock levels with a full movement ledger' },
  { icon: ScrollText, label: 'Sales challans', detail: 'Draft, confirm and dispatch with stock checks' },
];

export function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from ?? '/'} replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await signIn(email.trim(), password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? '/', { replace: true });
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setFieldErrors(error.fieldMessages);
        setFormError(error.fieldErrors.length > 0 ? null : error.message);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setFieldErrors({});
    setFormError(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-3 text-ink antialiased sm:p-6">
      <div className="grid w-full max-w-[1100px] gap-4 rounded-[24px] border border-white/40 bg-shell p-3 shadow-2xl sm:rounded-shell sm:p-4 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Brand / value panel */}
        <section className="flex flex-col justify-between gap-8 rounded-[22px] border border-white/60 bg-white/50 p-6 backdrop-blur-md sm:rounded-panel sm:p-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-lg font-bold text-white">
                E
              </span>
              <span className="text-sm font-semibold">Mini ERP + CRM</span>
            </div>

            <h1 className="mt-8 text-3xl font-semibold tracking-tight text-gray-400 sm:text-4xl">
              Operations portal
              <span className="block text-ink">for wholesale teams</span>
            </h1>
            <p className="mt-3 max-w-sm text-sm text-gray-500">
              One place for the sales, warehouse and accounts desks to manage customers, stock and
              dispatch — with the business rules enforced on the server.
            </p>
          </div>

          <ul className="flex flex-col gap-2">
            {HIGHLIGHTS.map(({ icon: Icon, label, detail }) => (
              <li
                key={label}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white/80 p-2.5"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-gray-800">{label}</span>
                  <span className="block truncate text-[11px] text-gray-500">{detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Sign-in panel */}
        <section className="flex flex-col justify-center rounded-[22px] border border-gray-100 bg-white p-6 shadow-sm sm:rounded-panel sm:p-8">
          <h2 className="text-xl font-semibold tracking-tight">Sign in</h2>
          <p className="mt-1 text-xs text-gray-500">Use your work email to access the portal.</p>

          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
            {formError ? <InlineError message={formError} /> : null}

            <TextInput
              label="Email"
              type="email"
              autoComplete="username"
              placeholder="you@minierp.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={fieldErrors.email}
              required
            />

            <TextInput
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={fieldErrors.password}
              required
            />

            <Button
              type="submit"
              variant="accent"
              size="md"
              className="mt-1 w-full"
              isLoading={isSubmitting}
              icon={isSubmitting ? undefined : <ArrowRight className="h-4 w-4" />}
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-4">
            <p className="text-[11px] font-semibold text-gray-600">
              Demo accounts
              <span className="ml-1 font-normal text-gray-400">password {DEMO_PASSWORD}</span>
            </p>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => applyDemoAccount(account.email)}
                  className="rounded-xl border border-gray-100 bg-gray-50/70 px-2.5 py-2 text-left transition hover:border-gray-200 hover:bg-white"
                >
                  <span className="block text-[11px] font-bold text-gray-800">{account.role}</span>
                  <span className="block truncate text-[10px] text-gray-500">{account.description}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
