import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth-store';
import { inputClass, labelClass, fieldErrorClass, fieldErrorText } from '../../components/ui';
import { EMAIL_REGEX, PASSWORD_REGEX } from '../../lib/validation';

export function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = Boolean(email || password);
  const emailError = dirty && !EMAIL_REGEX.test(email) ? 'Enter a valid email' : '';
  const passwordError = dirty && !PASSWORD_REGEX.test(password) ? 'Min 8 chars with letter and number' : '';
  const valid = !emailError && !passwordError;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!valid) return;
    setLoading(true);
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    try {
      const form = new URLSearchParams();
      form.set('username', email);
      form.set('password', password);
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Login failed');
      setAuth(data.access_token, data.refresh_token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-24 max-w-md">
      <h1 className="mb-6 text-2xl font-semibold">Sign in to SiteForge</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className={labelClass()}>Email</label>
          <input className={inputClass({ dirty, error: emailError })} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <p className={fieldErrorClass({ error: emailError })}>{fieldErrorText({ error: emailError })}</p>
        </div>
        <div>
          <label className={labelClass()}>Password</label>
          <input className={inputClass({ dirty, error: passwordError })} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className={fieldErrorClass({ error: passwordError })}>{fieldErrorText({ error: passwordError })}</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading || !valid} className="w-full rounded-xl bg-brand-600 py-2 font-semibold text-white disabled:opacity-50">Sign in</button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        Don't have an account? <Link className="text-brand-600 underline" to="/register">Create one</Link>
      </p>
    </div>
  );
}
