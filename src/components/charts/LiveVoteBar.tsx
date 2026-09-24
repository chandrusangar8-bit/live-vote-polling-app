import React from 'react';
import { PollOption } from '../../types';

interface LiveVoteBarProps {
  option: PollOption;
  totalVotes: number;
  isSelected?: boolean;
  isHovered?: boolean;
  onHover?: (hovered: boolean) => void;
  showCheckmark?: boolean;
}

export const LiveVoteBar: React.FC<LiveVoteBarProps> = ({
  option,
  totalVotes,
  isSelected,
  isHovered,
  onHover,
  showCheckmark
}) => {
  const percentage = totalVotes > 0 ? Math.round((option.count / totalVotes) * 1000) / 10 : 0;

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border p-3.5 transition-all duration-200 ${
        isSelected
          ? 'border-cyan-500/60 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
          : isHovered
          ? 'border-white/20 bg-slate-800/40'
          : 'border-white/5 bg-slate-900/40'
      }`}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      {/* Background Animated Progress Bar */}
      <div
        className="absolute inset-y-0 left-0 transition-all duration-500 ease-out opacity-20 pointer-events-none"
        style={{
          width: `${percentage}%`,
          backgroundColor: option.color
        }}
      />

      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Color Indicator */}
          <span
            className="w-3 h-3 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: option.color }}
          />

          <span className="text-sm font-medium text-slate-200 truncate">
            {option.text}
          </span>

          {showCheckmark && isSelected && (
            <span className="text-[11px] font-semibold text-cyan-400 bg-cyan-950/70 border border-cyan-500/30 px-2 py-0.5 rounded-full shrink-0">
              Your Choice
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-mono tabular-nums text-slate-400">
            {option.count} {option.count === 1 ? 'vote' : 'votes'}
          </span>
          <span className="text-sm font-bold font-mono tabular-nums text-slate-100 min-w-[45px] text-right">
            {percentage}%
          </span>
        </div>
      </div>
    </div>
  );
};
