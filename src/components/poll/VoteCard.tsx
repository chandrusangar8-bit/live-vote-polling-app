import React, { useState } from 'react';
import { Poll, PollOption } from '../../types';
import { InteractivePieChart } from '../charts/InteractivePieChart';
import { LiveVoteBar } from '../charts/LiveVoteBar';
import { QrCodeSvg } from '../common/QrCodeSvg';
import {
  Radio,
  CheckCircle2,
  Copy,
  Check,
  Presentation,
  QrCode,
  ShieldCheck,
  Users,
  Lock,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface VoteCardProps {
  poll: Poll;
  hasVoted: boolean;
  userVote: string[] | null;
  isConnected: boolean;
  onVote: (optionIds: string[]) => Promise<void>;
  onOpenProjector: () => void;
  onCopyLink: () => void;
  isCopied: boolean;
}

export const VoteCard: React.FC<VoteCardProps> = ({
  poll,
  hasVoted,
  userVote,
  isConnected,
  onVote,
  onOpenProjector,
  onCopyLink,
  isCopied
}) => {
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [hoveredOptionId, setHoveredOptionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [activeTab, setActiveTab] = useState<'chart' | 'bars'>('chart');

  const shareUrl = `${window.location.origin}/#poll=${poll.id}`;

  const toggleOption = (optionId: string) => {
    if (hasVoted || poll.isClosed) return;

    if (poll.allowMultiple) {
      setSelectedOptionIds((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
      );
    } else {
      setSelectedOptionIds([optionId]);
    }
  };

  const handleCastVote = async () => {
    if (selectedOptionIds.length === 0 || isSubmitting || hasVoted || poll.isClosed) return;

    try {
      setIsSubmitting(true);
      await onVote(selectedOptionIds);

      // Trigger celebratory confetti burst
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#38bdf8', '#818cf8', '#34d399', '#f472b6']
      });
    } catch {
      // Handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-2xl shadow-2xl p-6 sm:p-10">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-cyan-400">{poll.category}</span>
          <span aria-hidden="true">·</span>
          <span>Created by {poll.creatorName}</span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1.5">
            {poll.isClosed ? (
              <span className="text-slate-400 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Closed
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" /> Live Polling
              </span>
            )}
          </span>
        </div>

        {/* Live Redis Pub/Sub WebSocket Connection Status */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-950/80 border border-white/5">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-400">
              {isConnected ? 'Redis Pub/Sub Active' : 'Connecting...'}
            </span>
          </div>

          <button
            onClick={() => setShowQr(!showQr)}
            title="Show Mobile QR Code"
            className={`p-2 rounded-xl border border-white/5 transition-colors cursor-pointer ${
              showQr ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <QrCode className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenProjector}
            title="Launch Projector Mode"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-white/10 transition-colors cursor-pointer"
          >
            <Presentation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Presenter View</span>
          </button>

          <button
            onClick={onCopyLink}
            title="Copy Share Link"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
              isCopied
                ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300'
                : 'border-white/10 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Link Copied' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* QR Code Popover */}
      {showQr && (
        <div className="my-6 p-6 rounded-2xl bg-slate-950/80 border border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-6 animate-fade-in">
          <div className="space-y-2 text-center sm:text-left">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
              <QrCode className="w-4 h-4 text-cyan-400" />
              <span>Scan to Vote with Mobile</span>
            </h4>
            <p className="text-xs text-slate-400 max-w-xs">
              Audience members can aim their smartphone camera directly at this QR code to cast their live vote instantly.
            </p>
            <div className="pt-2 text-[11px] font-mono text-cyan-400 select-all truncate max-w-xs">
              {shareUrl}
            </div>
          </div>
          <div className="shrink-0">
            <QrCodeSvg url={shareUrl} size={150} />
          </div>
        </div>
      )}

      {/* Main Question */}
      <div className="py-6 space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
          {poll.question}
        </h2>
        {poll.description && (
          <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">
            {poll.description}
          </p>
        )}
      </div>

      {/* Verified Status Banner */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950/50 border border-white/5">
        <div className="flex items-center gap-2 text-xs">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-300">
            {poll.allowMultiple ? 'Multiple choices permitted' : 'Strict 1-person-1-vote enforced'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-slate-400">
          <Users className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-bold text-white">{poll.totalVotes}</span>
          <span>{poll.totalVotes === 1 ? 'ballot recorded' : 'ballots recorded'}</span>
        </div>
      </div>

      {/* Split View: Voting / Results & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Option Selection or Breakdown List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {hasVoted ? 'Live Results Breakdown' : 'Select Your Option'}
            </h4>
            {hasVoted && (
              <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Your vote is verified
              </span>
            )}
          </div>

          {!hasVoted && !poll.isClosed ? (
            // Voting Mode: Interactive selection cards
            <div className="space-y-3">
              {poll.options.map((option) => {
                const isSelected = selectedOptionIds.includes(option.id);
                return (
                  <div
                    key={option.id}
                    onClick={() => toggleOption(option.id)}
                    className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_20px_rgba(56,189,248,0.15)] ring-1 ring-cyan-400'
                        : 'border-white/10 bg-slate-800/40 hover:bg-slate-800/70 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-400 text-slate-950'
                            : 'border-white/20 bg-slate-950/40'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      <span className="text-sm font-medium text-white truncate">
                        {option.text}
                      </span>
                    </div>

                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 ml-2"
                      style={{ backgroundColor: option.color }}
                    />
                  </div>
                );
              })}

              {/* Submit Vote Button */}
              <div className="pt-3">
                <button
                  onClick={handleCastVote}
                  disabled={selectedOptionIds.length === 0 || isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 text-sm font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 rounded-xl shadow-lg shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>{isSubmitting ? 'Recording Atomic Vote...' : 'Submit Vote'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[11px] text-center text-slate-500 mt-2">
                  Atomic counting guarantees your vote is broadcasted instantly to all screens.
                </p>
              </div>
            </div>
          ) : (
            // Results Mode (already voted or poll closed)
            <div className="space-y-2.5">
              {poll.options.map((option) => (
                <LiveVoteBar
                  key={option.id}
                  option={option}
                  totalVotes={poll.totalVotes}
                  isSelected={userVote?.includes(option.id)}
                  isHovered={hoveredOptionId === option.id}
                  onHover={(h) => setHoveredOptionId(h ? option.id : null)}
                  showCheckmark={true}
                />
              ))}

              {poll.isClosed && (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-slate-400 text-center mt-3">
                  This poll has been concluded by the creator. Results are finalized.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Interactive Analytical Donut / Pie Chart */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950/50 border border-white/5">
          <div className="w-full flex items-center justify-between pb-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Real-Time Analytics
            </h4>
            <span className="text-[11px] font-mono text-cyan-400">
              Live Redis Feed
            </span>
          </div>

          <InteractivePieChart
            options={poll.options}
            totalVotes={poll.totalVotes}
            highlightedOptionId={hoveredOptionId}
            onOptionHover={setHoveredOptionId}
            size={260}
          />

          {/* Interactive Legend */}
          <div className="w-full mt-6 space-y-1.5">
            {poll.options.map((opt) => {
              const pct = poll.totalVotes > 0 ? Math.round((opt.count / poll.totalVotes) * 1000) / 10 : 0;
              const isHovered = hoveredOptionId === opt.id;
              return (
                <div
                  key={opt.id}
                  onMouseEnter={() => setHoveredOptionId(opt.id)}
                  onMouseLeave={() => setHoveredOptionId(null)}
                  className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    isHovered ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: opt.color }}
                    />
                    <span className="truncate max-w-[150px]">{opt.text}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono tabular-nums shrink-0">
                    <span>{opt.count}</span>
                    <span className="text-slate-500 font-bold">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
