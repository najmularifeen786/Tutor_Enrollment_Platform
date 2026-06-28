import React, { useState } from 'react';
import { X } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: { user_type: string; token: string; user_id: number }) => void;
  onNavigate: (page: string) => void;
}

export default function AuthModal({ onClose, onLoginSuccess, onNavigate }: AuthModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('tutor');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, user_type: userType })
      });
      
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user_type', data.user_type);
        localStorage.setItem('user_id', data.user_id.toString());
        onLoginSuccess({ user_type: data.user_type, token: data.token, user_id: data.user_id });
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border-2 border-slate-900 shadow-[8px_8px_0_0_#0f172a] w-full max-w-md relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-900 hover:bg-indigo-100 transition-colors border-2 border-transparent hover:border-slate-900"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-bold uppercase tracking-wider text-slate-900 mb-2">Welcome Back</h2>
          <p className="text-slate-600 font-medium mb-8">Please enter your details to sign in.</p>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm border-2 border-red-900 font-bold uppercase tracking-wider">
                {error}
              </div>
            )}

            <div className="flex bg-indigo-50 border-2 border-slate-900 p-1">
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider transition-colors ${userType === 'tutor' ? 'bg-indigo-500 text-white border-2 border-slate-900' : 'text-slate-600 hover:bg-indigo-100 border-2 border-transparent'}`}
                onClick={() => setUserType('tutor')}
              >
                Tutor
              </button>
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider transition-colors ${userType === 'admin' ? 'bg-indigo-500 text-white border-2 border-slate-900' : 'text-slate-600 hover:bg-indigo-100 border-2 border-transparent'}`}
                onClick={() => setUserType('admin')}
              >
                Admin
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">Username</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:border-indigo-600 text-slate-900 placeholder-slate-400 font-medium"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold uppercase tracking-wider text-slate-900">Password</label>
                  <a href="#" className="text-xs font-bold uppercase tracking-wider text-indigo-600 hover:text-slate-900">Forgot?</a>
                </div>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 bg-white border-2 border-slate-900 focus:outline-none focus:border-indigo-600 text-slate-900 placeholder-slate-400 font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-indigo-500 hover:bg-slate-900 text-white font-bold uppercase tracking-wider transition-colors border-2 border-slate-900 disabled:opacity-70 flex justify-center items-center shadow-[4px_4px_0_0_#0f172a] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {userType === 'tutor' && (
            <div className="mt-8 text-center text-sm font-medium text-slate-600">
              Don't have an account?{' '}
              <button 
                onClick={() => {
                  onClose();
                  onNavigate('register');
                }}
                className="font-bold uppercase tracking-wider text-indigo-600 hover:text-slate-900 ml-1"
              >
                Register as Tutor
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
