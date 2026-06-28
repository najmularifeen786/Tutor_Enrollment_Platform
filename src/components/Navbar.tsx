import React from 'react';
import { BookOpen, LogOut, User, LayoutDashboard, UserPlus } from 'lucide-react';

interface NavbarProps {
  user: { user_type: string; token: string } | null;
  onLoginClick: () => void;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

export default function Navbar({ user, onLoginClick, onLogout, onNavigate }: NavbarProps) {
  return (
    <header className="border-b-2 border-slate-900 bg-white p-4 sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        
        {/* Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => onNavigate('home')}
        >
          <div className="bg-slate-900 text-white p-2">
            <BookOpen size={24} />
          </div>
          <span className="text-xl font-bold uppercase tracking-widest text-slate-900 hidden sm:block">
            Tutor Platform
          </span>
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center gap-6">
          <div className="h-6 w-px bg-slate-900 mx-1 hidden sm:block"></div>

          {!user ? (
            <div className="flex items-center gap-6">
              <button 
                onClick={() => onNavigate('register')}
                className="hidden sm:flex items-center gap-1 text-sm font-bold uppercase tracking-wider text-slate-900 transition-colors hover:text-indigo-600"
              >
                <UserPlus size={18} />
                <span>Become a Tutor</span>
              </button>
              <button 
                onClick={onLoginClick}
                className="flex items-center gap-1 border-2 border-slate-900 bg-indigo-500 px-4 py-2 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-slate-900"
              >
                <User size={18} />
                <span>Login</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <button
                onClick={() => onNavigate(user.user_type === 'admin' ? 'admin' : 'dashboard')}
                className="flex items-center gap-1 text-sm font-bold uppercase tracking-wider text-slate-900 transition-colors hover:text-indigo-600"
              >
                <LayoutDashboard size={18} />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button 
                onClick={onLogout}
                className="flex items-center gap-1 text-sm font-bold uppercase tracking-wider text-slate-900 transition-colors hover:text-indigo-600"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
