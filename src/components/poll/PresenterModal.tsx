import React, { useState } from 'react';
import { Poll } from '../../types';
import { InteractivePieChart } from '../charts/InteractivePieChart';
import { QrCodeSvg } from '../common/QrCodeSvg';
import { X, Maximize2, Radio, Users, Sparkles } from 'lucide-react';

interface PresenterModalProps {
  isOpen: boolean;
  poll: Poll | null;
  isConnected: boolean;
  onClose: () => void;
}

export const PresenterModal: React.FC<PresenterModalProps> = ({
  isOpen,
  poll,
  isConnected,
  onClose
}) => {
  const [hoveredOptionId, setHoveredOptionId] = useState<string | null>(null);

  if (!isOpen || !poll) return null;

  const shareUrl = `${window.location.origin}/#poll=${poll.id}`;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col p-6 sm:p-12 overflow-y-auto">
      {/* Top Bar Controls */}
      <div className="flex items-center justify-between pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-xs text-cyan-300 font-mono">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span>PulseVote Projector Engine</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400'
              }`}
            />
            <span>{isConnected ? 'Redis Pub/Sub Synchronized' : 'Reconnecting...'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="p-2.5 rounded-xl border border-white/10 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            title="Exit Projector Mode"
            className="p-2.5 rounded-xl border border-white/10 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Presentation Stage */}
      <div className="flex-1 flex flex-col justify-center max-w-6xl mx-auto w-full py-8">
        <div className="text-center space-y-3 mb-10">
          <span className="text-xs uppercase tracking-widest text-cyan-400 font-semibold">
            {poll.category} Live Audience Poll
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight">
            {poll.question}
          </h1>
          {poll.description && (
            <p className="text-base text-slate-400 max-w-2xl mx-auto">
              {poll.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Big Interactive Pie Chart */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center p-8 rounded-3xl bg-slate-900/50 border border-white/5 backdrop-blur-xl">
            <InteractivePieChart
              options={poll.options}
              totalVotes={poll.totalVotes}
              highlightedOptionId={hoveredOptionId}
              onOptionHover={setHoveredOptionId}
              size={360}
            />

            {/* Total Count Telemetry Callout */}
            <div className="mt-8 flex items-center gap-3 px-6 py-2.5 rounded-full bg-slate-950/80 border border-white/10">
              <Users className="w-5 h-5 text-cyan-400" />
              <span className="text-lg font-bold font-mono tabular-nums text-white">
                {poll.totalVotes}
              </span>
              <span className="text-xs uppercase tracking-wider text-slate-400">
                Audience Ballots Cast
              </span>
            </div>
          </div>

          {/* Side: QR Code for Audience & Live Leaderboard */}
          <div className="lg:col-span-5 space-y-6">
            {/* QR Card */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              <div className="shrink-0 shadow-2xl">
                <QrCodeSvg url={shareUrl} size={140} />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Join On Your Phone</span>
                </div>
                <h4 className="text-sm font-semibold text-white">Scan QR Code to Vote</h4>
                <p className="text-xs text-slate-400">
                  Open phone camera and aim at the QR pattern to vote in real-time.
                </p>
                <p className="text-[11px] font-mono text-slate-500 truncate max-w-[200px]">
                  {shareUrl}
                </p>
              </div>
            </div>

            {/* Live Ranked Options */}
            <div className="space-y-2 p-6 rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-xl">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Live Distribution
              </h4>
              {[...poll.options]
                .sort((a, b) => b.count - a.count)
                .map((opt, rank) => {
                  const pct = poll.totalVotes > 0 ? Math.round((opt.count / poll.totalVotes) * 1000) / 10 : 0;
                  return (
                    <div
                      key={opt.id}
                      onMouseEnter={() => setHoveredOptionId(opt.id)}
                      onMouseLeave={() => setHoveredOptionId(null)}
                      className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between transition-colors hover:border-white/20"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono font-bold text-slate-500 w-4">
                          #{rank + 1}
                        </span>
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: opt.color }}
                        />
                        <span className="text-sm font-medium text-slate-200 truncate max-w-[180px]">
                          {opt.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 font-mono tabular-nums shrink-0">
                        <span className="text-xs text-slate-400">{opt.count}</span>
                        <span className="text-sm font-bold text-white min-w-[44px] text-right">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
