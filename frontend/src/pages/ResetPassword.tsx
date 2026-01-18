import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { Lock, User, KeyRound, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError('');

    try {
      await api.patch('/auth/reset-password', { username, new_password: newPassword });
      setStatus('success');
      setTimeout(() => navigate('/login'), 2000); // Redirect after 2s
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset password.');
      setStatus('idle');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl text-white font-bold">Password Updated</h2>
          <p className="text-slate-400 mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-lg shadow-xl p-8">
        <div className="mb-6">
          <Link to="/login" className="text-slate-500 hover:text-slate-300 flex items-center gap-2 text-sm mb-4">
            <ArrowLeft size={14} /> Back to Login
          </Link>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <KeyRound className="text-indigo-500" /> Reset Password
          </h1>
          <p className="text-slate-400 text-sm mt-2">Enter your username to set a new password.</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-900/20 border border-red-800 rounded text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-3 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-background border border-border rounded py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-background border border-border rounded py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded transition-all disabled:opacity-50"
          >
            {status === 'loading' ? 'Updating...' : 'Set New Password'}
          </button>
        </form>
      </div>
    </div>
  );
}