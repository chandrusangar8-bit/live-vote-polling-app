import React from 'react';
import { User } from '../types';
import { Plus, LayoutDashboard, LogOut, Compass } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  currentView: 'explore' | 'dashboard' | 'poll';
  onNavigate: (view: 'explore' | 'dashboard') => void;
  onOpenCreateModal: () => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentView,
  onNavigate,
  onOpenCreateModal,
  onOpenAuthModal,
  onLogout
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onNavigate('explore')}
          className="text-xl font-bold tracking-tight text-white hover:text-cyan-400 transition-colors cursor-pointer"
        >
          PulseVote
        </button>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <button
            onClick={() => onNavigate('explore')}
            className={`transition-colors flex items-center gap-2 ${
              currentView === 'explore'
                ? 'text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Trending Polls</span>
          </button>

          {user && (
            <button
              onClick={() => onNavigate('dashboard')}
              className={`transition-colors flex items-center gap-2 ${
                currentView === 'dashboard'
                  ? 'text-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Creator Console</span>
            </button>
          )}

          <a
            href="#live-realtime"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('explore');
            }}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            Live Architecture
          </a>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={onOpenCreateModal}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 rounded-lg shadow-sm shadow-cyan-500/20 transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>New Poll</span>
              </button>

              <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
                <span className="text-xs font-medium text-slate-300 hidden sm:inline max-w-[120px] truncate">
                  {user.name}
                </span>
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAuthModal}
                className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                Sign In
              </button>
              <button
                onClick={onOpenAuthModal}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-sm shadow-cyan-500/20 transition-all cursor-pointer whitespace-nowrap"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
