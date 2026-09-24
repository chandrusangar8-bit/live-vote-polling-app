import React, { useState } from 'react';
import { Poll } from '../../types';
import { Search, Copy, Check, Trash2, ExternalLink, Presentation, Radio, Lock } from 'lucide-react';

interface PollTableListProps {
  polls: Poll[];
  isLoading: boolean;
  onOpenPoll: (pollId: string) => void;
  onOpenProjector: (poll: Poll) => void;
  onToggleStatus: (pollId: string, currentStatus: boolean) => void;
  onDeleteRequest: (poll: Poll) => void;
  onCopyLink: (pollId: string) => void;
  copiedPollId: string | null;
}

export const PollTableList: React.FC<PollTableListProps> = ({
  polls,
  isLoading,
  onOpenPoll,
  onOpenProjector,
  onToggleStatus,
  onDeleteRequest,
  onCopyLink,
  copiedPollId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');

  const filteredPolls = polls.filter((poll) => {
    const matchesSearch =
      poll.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      poll.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (poll.description && poll.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === 'active') return !poll.isClosed;
    if (statusFilter === 'closed') return poll.isClosed;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search and Segmented Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter polls by question or category..."
            className="w-full pl-10 pr-4 py-2.5 text-xs text-white glass-input rounded-xl focus:border-cyan-400 transition-all placeholder:text-slate-500"
          />
        </div>

        {/* Functional filter segmented control (buttons allowed per frontend guidelines) */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/60 border border-white/5 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({polls.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-slate-800 text-emerald-300 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Active ({polls.filter((p) => !p.isClosed).length})
          </button>
          <button
            onClick={() => setStatusFilter('closed')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'closed'
                ? 'bg-slate-800 text-slate-300 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Closed ({polls.filter((p) => p.isClosed).length})
          </button>
        </div>
      </div>

      {/* Poll Cards / Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-900/40 border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : filteredPolls.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-white/5 bg-slate-900/20">
          <p className="text-sm text-slate-400">
            {searchQuery ? 'No polls match your search query.' : 'You haven’t created any polls yet.'}
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Create your first live poll to start collecting atomic votes instantly.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPolls.map((poll) => {
            const isCopied = copiedPollId === poll.id;
            const topOption = [...poll.options].sort((a, b) => b.count - a.count)[0];
            const topPercent = poll.totalVotes > 0 && topOption ? Math.round((topOption.count / poll.totalVotes) * 100) : 0;

            return (
              <div
                key={poll.id}
                className="group p-5 rounded-2xl border border-white/5 bg-slate-900/40 hover:bg-slate-900/70 hover:border-white/10 transition-all duration-200"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Poll Metadata & Question */}
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{poll.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Created {new Date(poll.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1.5 font-medium">
                        {poll.isClosed ? (
                          <span className="flex items-center gap-1 text-slate-400">
                            <Lock className="w-3 h-3" /> Closed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Radio className="w-3 h-3 animate-pulse" /> Live Now
                          </span>
                        )}
                      </span>
                    </div>

                    <h4
                      onClick={() => onOpenPoll(poll.id)}
                      className="text-base font-semibold text-white group-hover:text-cyan-400 transition-colors cursor-pointer"
                    >
                      {poll.question}
                    </h4>

                    {poll.description && (
                      <p className="text-xs text-slate-400 line-clamp-1">{poll.description}</p>
                    )}

                    {/* Quick Preview of Leading Option */}
                    {poll.totalVotes > 0 && topOption && (
                      <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                        <span className="text-slate-500">Leading:</span>
                        <span className="text-slate-300 font-medium truncate max-w-[240px]">{topOption.text}</span>
                        <span className="font-mono tabular-nums text-cyan-400">({topPercent}%)</span>
                      </div>
                    )}
                  </div>

                  {/* Actions & Live Metrics */}
                  <div className="flex flex-wrap items-center gap-3 lg:self-center shrink-0">
                    {/* Live Vote Tally */}
                    <div className="px-3 py-1.5 rounded-lg bg-slate-950/60 border border-white/5 text-right min-w-[90px]">
                      <div className="text-sm font-bold font-mono tabular-nums text-white">
                        {poll.totalVotes}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                        {poll.totalVotes === 1 ? 'Vote' : 'Votes'}
                      </div>
                    </div>

                    {/* Dedicated Copy Share Link Button */}
                    <button
                      onClick={() => onCopyLink(poll.id)}
                      title="Copy Public Share Link"
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                        isCopied
                          ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300'
                          : 'border-white/10 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Copied' : 'Share Link'}</span>
                    </button>

                    {/* Presenter / Big Screen Projector View */}
                    <button
                      onClick={() => onOpenProjector(poll)}
                      title="Open Big-Screen Presentation View"
                      className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg border border-white/5 transition-colors cursor-pointer"
                    >
                      <Presentation className="w-4 h-4" />
                    </button>

                    {/* Open Voting Page */}
                    <button
                      onClick={() => onOpenPoll(poll.id)}
                      title="Open Public Voting Page"
                      className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg border border-white/5 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>

                    {/* Toggle Active / Closed */}
                    <button
                      onClick={() => onToggleStatus(poll.id, poll.isClosed)}
                      title={poll.isClosed ? 'Reopen poll' : 'Close poll'}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        poll.isClosed
                          ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                          : 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                      }`}
                    >
                      {poll.isClosed ? 'Reopen' : 'Close'}
                    </button>

                    {/* Dedicated Delete Button (Exclusively for Creator) */}
                    <button
                      onClick={() => onDeleteRequest(poll)}
                      title="Delete poll permanently"
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
