import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { CreatorStatsGrid } from './components/dashboard/CreatorStatsGrid';
import { PollTableList } from './components/dashboard/PollTableList';
import { VoteCard } from './components/poll/VoteCard';
import { CreatePollModal } from './components/poll/CreatePollModal';
import { DeleteConfirmModal } from './components/poll/DeleteConfirmModal';
import { PresenterModal } from './components/poll/PresenterModal';
import { AuthModal } from './components/auth/AuthModal';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { api, setAuthToken, getAuthToken } from './services/api';
import { usePollSocket } from './services/socket';
import { Poll, User, CreatorStats, WsVoteCastMessage } from './types';
import {
  Radio,
  Zap,
  ShieldCheck,
  Activity,
  Plus,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'explore' | 'dashboard' | 'poll'>('explore');
  const [activePollId, setActivePollId] = useState<string | null>(null);
  const [activePollData, setActivePollData] = useState<{
    poll: Poll;
    hasVoted: boolean;
    userVote: string[] | null;
  } | null>(null);

  // Creator Dashboard state
  const [creatorPolls, setCreatorPolls] = useState<Poll[]>([]);
  const [creatorStats, setCreatorStats] = useState<CreatorStats | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  // Trending Public Polls state
  const [trendingPolls, setTrendingPolls] = useState<Poll[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPresenterModalOpen, setIsPresenterModalOpen] = useState(false);
  const [projectorPoll, setProjectorPoll] = useState<Poll | null>(null);
  const [deleteTargetPoll, setDeleteTargetPoll] = useState<Poll | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // UI helpers
  const [copiedPollId, setCopiedPollId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', text: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Real-time WebSocket hook for current active poll
  const handleWsMessage = useCallback((msg: WsVoteCastMessage) => {
    setActivePollData((prev) => {
      if (!prev || prev.poll.id !== msg.pollId) return prev;
      return {
        ...prev,
        poll: {
          ...prev.poll,
          totalVotes: msg.totalVotes,
          options: msg.options,
          isClosed: msg.isClosed !== undefined ? msg.isClosed : prev.poll.isClosed
        }
      };
    });

    // Also update projector poll if open
    setProjectorPoll((prev) => {
      if (!prev || prev.id !== msg.pollId) return prev;
      return {
        ...prev,
        totalVotes: msg.totalVotes,
        options: msg.options,
        isClosed: msg.isClosed !== undefined ? msg.isClosed : prev.isClosed
      };
    });

    // Also update in creator list if present
    setCreatorPolls((prev) =>
      prev.map((p) => (p.id === msg.pollId ? { ...p, totalVotes: msg.totalVotes, options: msg.options } : p))
    );

    // Also update in trending list if present
    setTrendingPolls((prev) =>
      prev.map((p) => (p.id === msg.pollId ? { ...p, totalVotes: msg.totalVotes, options: msg.options } : p))
    );
  }, []);

  const { isConnected: isWsConnected } = usePollSocket(
    activePollId || projectorPoll?.id || null,
    handleWsMessage
  );

  // Initial Load & Auth Check
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      api.getMe()
        .then((res) => {
          setUser(res.user);
        })
        .catch(() => {
          setAuthToken(null);
        });
    }

    // Check URL hash for direct poll link (e.g. #poll=poll_cloud_2026)
    const hash = window.location.hash;
    if (hash && hash.includes('poll=')) {
      const pId = hash.split('poll=')[1].split('&')[0];
      if (pId) {
        openPoll(pId);
        return;
      }
    }

    loadTrendingPolls();
  }, []);

  // Listen for hash change for deep linking
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash && hash.includes('poll=')) {
        const pId = hash.split('poll=')[1].split('&')[0];
        if (pId) {
          openPoll(pId);
        }
      } else if (!hash || hash === '#') {
        if (currentView === 'poll') {
          setCurrentView('explore');
          setActivePollId(null);
        }
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [currentView]);

  const loadTrendingPolls = async () => {
    setIsLoadingTrending(true);
    try {
      const res = await api.getPublicTrendingPolls();
      setTrendingPolls(res.polls);
    } catch (err: any) {
      addToast('error', 'Failed to load trending polls');
    } finally {
      setIsLoadingTrending(false);
    }
  };

  const loadDashboardData = async () => {
    setIsLoadingDashboard(true);
    try {
      const [pollsRes, statsRes] = await Promise.all([
        api.getCreatorPolls(),
        api.getCreatorStats()
      ]);
      setCreatorPolls(pollsRes.polls);
      setCreatorStats(statsRes);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to load creator polls');
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  const openPoll = async (pollId: string) => {
    window.location.hash = `poll=${pollId}`;
    setActivePollId(pollId);
    setCurrentView('poll');
    try {
      const res = await api.getPollDetails(pollId);
      setActivePollData(res);
    } catch (err: any) {
      addToast('error', err.message || 'Poll not found');
      setCurrentView('explore');
      setActivePollId(null);
    }
  };

  const handleCastVote = async (optionIds: string[]) => {
    if (!activePollId) return;
    try {
      const res = await api.castVote(activePollId, optionIds);
      setActivePollData({
        poll: res.poll,
        hasVoted: true,
        userVote: res.userVote
      });
      addToast('success', 'Ballot recorded! Live counts updated across all screens.');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to submit vote');
      throw err;
    }
  };

  const handleCreatePoll = async (payload: {
    question: string;
    description?: string;
    category: string;
    options: { text: string; color: string }[];
    allowMultiple: boolean;
    expiresAt?: string | null;
  }) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const res = await api.createPoll(payload);
    addToast('success', 'Live poll published! Ready for audience voting.');
    // Refresh creator polls
    loadDashboardData();
    loadTrendingPolls();
    // Navigate directly to new poll
    openPoll(res.poll.id);
  };

  const handleToggleStatus = async (pollId: string, currentStatus: boolean) => {
    try {
      const res = await api.togglePollStatus(pollId, !currentStatus);
      setCreatorPolls((prev) =>
        prev.map((p) => (p.id === pollId ? res.poll : p))
      );
      if (activePollData && activePollData.poll.id === pollId) {
        setActivePollData({ ...activePollData, poll: res.poll });
      }
      addToast('info', res.poll.isClosed ? 'Poll closed to new votes' : 'Poll reopened');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to toggle status');
    }
  };

  const handleDeletePoll = async () => {
    if (!deleteTargetPoll) return;
    setIsDeleting(true);
    try {
      await api.deletePoll(deleteTargetPoll.id);
      addToast('success', 'Poll deleted permanently');
      setCreatorPolls((prev) => prev.filter((p) => p.id !== deleteTargetPoll.id));
      if (activePollId === deleteTargetPoll.id) {
        setCurrentView('dashboard');
        setActivePollId(null);
        setActivePollData(null);
      }
      setDeleteTargetPoll(null);
      loadDashboardData();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete poll');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyLink = (pollId: string) => {
    const url = `${window.location.origin}/#poll=${pollId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedPollId(pollId);
      addToast('success', 'Shareable link copied to clipboard!');
      setTimeout(() => setCopiedPollId(null), 2500);
    });
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setCurrentView('explore');
    addToast('info', 'Signed out successfully');
  };

  const handleNavigate = (view: 'explore' | 'dashboard') => {
    if (view === 'dashboard' && !user) {
      setIsAuthModalOpen(true);
      return;
    }
    window.location.hash = '';
    setActivePollId(null);
    setCurrentView(view);
    if (view === 'dashboard') {
      loadDashboardData();
    } else {
      loadTrendingPolls();
    }
  };

  // Categories for filter
  const categories = ['All', 'Technology', 'Engineering', 'Product Strategy', 'Workplace', 'General'];
  const filteredTrending = trendingPolls.filter((p) =>
    selectedCategory === 'All' ? true : p.category === selectedCategory
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Navigation */}
      <Navbar
        user={user}
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenCreateModal={() => {
          if (!user) {
            setIsAuthModalOpen(true);
          } else {
            setIsCreateModalOpen(true);
          }
        }}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* VIEW 1: Public Voting Page */}
        {currentView === 'poll' && activePollData && (
          <div className="space-y-6">
            <button
              onClick={() => handleNavigate(user ? 'dashboard' : 'explore')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              ← Back to {user ? 'Creator Console' : 'Trending Polls'}
            </button>

            <VoteCard
              poll={activePollData.poll}
              hasVoted={activePollData.hasVoted}
              userVote={activePollData.userVote}
              isConnected={isWsConnected}
              onVote={handleCastVote}
              onOpenProjector={() => {
                setProjectorPoll(activePollData.poll);
                setIsPresenterModalOpen(true);
              }}
              onCopyLink={() => handleCopyLink(activePollData.poll.id)}
              isCopied={copiedPollId === activePollData.poll.id}
            />
          </div>
        )}

        {/* VIEW 2: Creator Dashboard */}
        {currentView === 'dashboard' && user && (
          <div className="space-y-8 animate-fade-in">
            {/* Header Title & CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Creator Console
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Manage live polling sessions, track atomic participation, and broadcast shareable ballots.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Poll</span>
                </button>
              </div>
            </div>

            {/* Creator Metrics Grid */}
            <CreatorStatsGrid stats={creatorStats} isLoading={isLoadingDashboard} />

            {/* Creator Polls Table / List with Search & Actions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">Your Polling Sessions</h2>
                <span className="text-xs text-slate-500 font-mono">
                  {creatorPolls.length} total created
                </span>
              </div>

              <PollTableList
                polls={creatorPolls}
                isLoading={isLoadingDashboard}
                onOpenPoll={openPoll}
                onOpenProjector={(poll) => {
                  setProjectorPoll(poll);
                  setIsPresenterModalOpen(true);
                }}
                onToggleStatus={handleToggleStatus}
                onDeleteRequest={(poll) => setDeleteTargetPoll(poll)}
                onCopyLink={handleCopyLink}
                copiedPollId={copiedPollId}
              />
            </div>
          </div>
        )}

        {/* VIEW 3: Explore / Landing Page */}
        {currentView === 'explore' && (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="relative py-10 sm:py-16 text-center max-w-4xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-xs font-medium text-cyan-300">
                <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                <span>Redis Pub/Sub & Atomic In-Memory Engine</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
                Instant Audience Insight. <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
                  Zero Delay. Zero Slop.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                PulseVote powers ultra-fast live polling with atomic in-memory vote counters,
                strict one-person-one-vote verification, and real-time WebSocket chart broadcasts.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    if (user) {
                      setIsCreateModalOpen(true);
                    } else {
                      setIsAuthModalOpen(true);
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-3 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 rounded-xl shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create a Live Poll</span>
                </button>

                <button
                  onClick={() => {
                    if (trendingPolls.length > 0) {
                      openPoll(trendingPolls[0].id);
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-3 text-xs font-semibold text-slate-200 bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-white/10 transition-colors cursor-pointer"
                >
                  <span>Vote in Live Demo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Architecture Highlights */}
            <div id="live-realtime" className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md space-y-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Atomic In-Memory Counters</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Vote tallies increment with atomic O(1) in-memory precision. No database lock contention, even under surge conditions.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Redis Pub/Sub WebSockets</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Every ballot cast publishes instantly to dedicated poll channels, refreshing client charts and progress bars without page reloads.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Strict 1-Person-1-Vote</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cryptographic visitor fingerprinting and audit verification prevents ballot stuffing while allowing instant guest participation.
                </p>
              </div>
            </div>

            {/* Trending Active Polls Section */}
            <div className="space-y-6 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                    <span>Trending Public Polls</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Live community benchmarks updating in real time.
                  </p>
                </div>

                {/* Filter tags (segmented control) */}
                <div className="flex items-center gap-1 p-1 bg-slate-900/80 border border-white/5 rounded-xl overflow-x-auto max-w-full">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                        selectedCategory === cat
                          ? 'bg-slate-800 text-cyan-300 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {isLoadingTrending ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-44 rounded-2xl bg-slate-900/50 border border-white/5 animate-pulse" />
                  ))}
                </div>
              ) : filteredTrending.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-white/5 bg-slate-900/20">
                  <p className="text-sm text-slate-400">No active polls found in this category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredTrending.map((poll) => {
                    const topOpt = [...poll.options].sort((a, b) => b.count - a.count)[0];
                    const topPct = poll.totalVotes > 0 && topOpt ? Math.round((topOpt.count / poll.totalVotes) * 100) : 0;

                    return (
                      <div
                        key={poll.id}
                        onClick={() => openPoll(poll.id)}
                        className="group p-6 rounded-2xl border border-white/5 bg-slate-900/40 hover:bg-slate-900/80 hover:border-cyan-500/30 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span className="font-semibold text-cyan-400">{poll.category}</span>
                            <span className="flex items-center gap-1 text-emerald-400">
                              <Radio className="w-2.5 h-2.5 animate-pulse" /> Live
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                            {poll.question}
                          </h3>

                          {poll.description && (
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                              {poll.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-6 mt-4 border-t border-white/5 flex items-center justify-between text-xs">
                          <div className="font-mono tabular-nums text-slate-300 font-semibold">
                            {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'}
                          </div>

                          {topOpt && (
                            <div className="text-right">
                              <span className="text-[10px] text-slate-500 block">Leading choice</span>
                              <span className="text-xs text-slate-300 font-medium truncate max-w-[120px] inline-block">
                                {topOpt.text} <span className="text-cyan-400 font-mono">({topPct}%)</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950/80 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">PulseVote</span>
            <span>·</span>
            <span>Production Live Polling SaaS</span>
          </div>
          <div>
            <span>Redis Pub/Sub · Atomic Counters · JWT Auth · Real-Time WebSockets</span>
          </div>
        </div>
      </footer>

      {/* Modals & Dialogs */}
      <CreatePollModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePoll}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(u) => {
          setUser(u);
          addToast('success', `Welcome back, ${u.name}!`);
          handleNavigate('dashboard');
        }}
      />

      <PresenterModal
        isOpen={isPresenterModalOpen}
        poll={projectorPoll}
        isConnected={isWsConnected}
        onClose={() => {
          setIsPresenterModalOpen(false);
          setProjectorPoll(null);
        }}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTargetPoll}
        pollTitle={deleteTargetPoll?.question || ''}
        isDeleting={isDeleting}
        onConfirm={handleDeletePoll}
        onCancel={() => setDeleteTargetPoll(null)}
      />

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
