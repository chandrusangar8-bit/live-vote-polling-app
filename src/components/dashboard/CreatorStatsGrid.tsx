import React from 'react';
import { CreatorStats } from '../../types';
import { BarChart3, Radio, CheckCircle, Users } from 'lucide-react';

interface CreatorStatsGridProps {
  stats: CreatorStats | null;
  isLoading: boolean;
}

export const CreatorStatsGrid: React.FC<CreatorStatsGridProps> = ({ stats, isLoading }) => {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-slate-900/50 border border-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  const items = [
    {
      label: 'Total Polls Created',
      value: stats.totalPolls,
      icon: BarChart3,
      desc: `${stats.closedPolls} completed polls`,
      color: 'text-cyan-400'
    },
    {
      label: 'Active Live Polls',
      value: stats.activePolls,
      icon: Radio,
      desc: 'Currently accepting live votes',
      color: 'text-emerald-400'
    },
    {
      label: 'Total Votes Received',
      value: stats.totalVotes,
      icon: Users,
      desc: 'Atomic real-time counters',
      color: 'text-sky-400'
    },
    {
      label: 'Avg Participation',
      value: stats.avgVotesPerPoll,
      icon: CheckCircle,
      desc: 'Votes per poll average',
      color: 'text-indigo-400'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className="p-5 rounded-xl border border-white/5 bg-slate-900/40 backdrop-blur-md flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">{item.label}</span>
              <Icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <div>
              <div className="text-3xl font-extrabold font-mono tabular-nums text-white tracking-tight">
                {item.value}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{item.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
