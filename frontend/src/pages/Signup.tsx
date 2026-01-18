import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Lock, User, Copy, CheckCircle, Terminal } from 'lucide-react';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState<string | null>(null); // To store the result
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/signup', { username, password });
      // On success, we don't redirect yet. We show them the API Key.
      setUserId(response.data.user_id);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (userId) {
      navigator.clipboard.writeText(userId);
      alert("User ID copied to clipboard!");
    }
  };

  // SUCCESS STATE: Show the API Key
  if (userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-lg bg-surface border border-indigo-500/30 rounded-lg shadow-xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="text-green-500 w-16 h-16" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Account Created!</h2>
          <p className="text-slate-400 mb-6">Here is your User ID. You will need this for your Java SDK.</p>
          
          {/* Code Block */}
          <div className="bg-background border border-border rounded p-4 mb-6 text-left relative group">
            <div className="text-xs text-slate-500 font-mono mb-2 flex items-center gap-2">
              <Terminal size={12} /> Java Configuration
            </div>
            <code className="text-indigo-300 font-mono text-sm break-all">
              {userId}
            </code>
            <button 
              onClick={copyToClipboard}
              className="absolute top-3 right-3 p-1.5 bg-surface border border-border rounded hover:bg-slate-800 text-slate-400 transition-colors"
              title="Copy ID"
            >
              <Copy size={14} />
            </button>
          </div>

          <Link 
            to="/login"
            className="inline-block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded transition-all"
          >
            Proceed to Login
          </Link>
        </div>
      </div>
    );
  }

  // FORM STATE
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-100">Create Account</h1>
          <p className="text-slate-400 text-sm mt-2">Get your API Key for log ingestion</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-900/20 border border-red-800 rounded text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-3 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Choose Username"
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
              placeholder="Choose Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-border rounded py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded transition-all"
          >
            {loading ? 'Creating...' : 'Generate API Key'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Already have an API Key?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}