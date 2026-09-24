import React, { useState } from 'react';
import { PollOption } from '../../types';

interface InteractivePieChartProps {
  options: PollOption[];
  totalVotes: number;
  highlightedOptionId?: string | null;
  onOptionHover?: (optionId: string | null) => void;
  size?: number;
}

export const InteractivePieChart: React.FC<InteractivePieChartProps> = ({
  options,
  totalVotes,
  highlightedOptionId,
  onOptionHover,
  size = 280
}) => {
  const [activeHoverId, setActiveHoverId] = useState<string | null>(null);

  const effectiveHoverId = highlightedOptionId !== undefined ? highlightedOptionId : activeHoverId;

  const center = size / 2;
  const radius = size * 0.42;
  const innerRadius = size * 0.26; // Donut hole for metrics center

  // Pre-calculate slices
  let cumulativeAngle = -Math.PI / 2; // Start from top (12 o'clock)
  const slices = options.map((opt) => {
    const fraction = totalVotes > 0 ? opt.count / totalVotes : 1 / Math.max(options.length, 1);
    const angle = fraction * 2 * Math.PI;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle += angle;

    // SVG arc coordinates
    const isHovered = effectiveHoverId === opt.id;
    const currentRadius = isHovered ? radius + 6 : radius;
    const currentInner = isHovered ? innerRadius - 2 : innerRadius;

    const x1 = center + currentRadius * Math.cos(startAngle);
    const y1 = center + currentRadius * Math.sin(startAngle);
    const x2 = center + currentRadius * Math.cos(endAngle);
    const y2 = center + currentRadius * Math.sin(endAngle);

    const x3 = center + currentInner * Math.cos(endAngle);
    const y3 = center + currentInner * Math.sin(endAngle);
    const x4 = center + currentInner * Math.cos(startAngle);
    const y4 = center + currentInner * Math.sin(startAngle);

    const largeArc = angle > Math.PI ? 1 : 0;

    // If 100% single slice or empty, render circle
    const isFullCircle = options.length === 1 || (totalVotes > 0 && opt.count === totalVotes);

    const pathData = isFullCircle
      ? `M ${center} ${center - currentRadius}
         A ${currentRadius} ${currentRadius} 0 1 1 ${center} ${center + currentRadius}
         A ${currentRadius} ${currentRadius} 0 1 1 ${center} ${center - currentRadius}
         M ${center} ${center - currentInner}
         A ${currentInner} ${currentInner} 0 1 0 ${center} ${center + currentInner}
         A ${currentInner} ${currentInner} 0 1 0 ${center} ${center - currentInner}
         Z`
      : `M ${x1} ${y1} 
         A ${currentRadius} ${currentRadius} 0 ${largeArc} 1 ${x2} ${y2}
         L ${x3} ${y3}
         A ${currentInner} ${currentInner} 0 ${largeArc} 0 ${x4} ${y4}
         Z`;

    const percentage = totalVotes > 0 ? Math.round((opt.count / totalVotes) * 1000) / 10 : 0;

    return {
      option: opt,
      pathData,
      isHovered,
      percentage,
      count: opt.count,
      color: opt.color
    };
  });

  const activeSlice = slices.find((s) => s.option.id === effectiveHoverId);

  return (
    <div className="flex flex-col items-center">
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible select-none drop-shadow-md"
        >
          {/* Subtle outer guide ring */}
          <circle
            cx={center}
            cy={center}
            r={radius + 4}
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={1}
            strokeDasharray="2 4"
          />

          {/* Fallback empty ring if no votes */}
          {totalVotes === 0 && (
            <circle
              cx={center}
              cy={center}
              r={(radius + innerRadius) / 2}
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth={radius - innerRadius}
              strokeDasharray="4 6"
            />
          )}

          {/* Slices */}
          {slices.map((slice) => (
            <path
              key={slice.option.id}
              d={slice.pathData}
              fill={slice.color}
              opacity={effectiveHoverId && !slice.isHovered ? 0.35 : 0.92}
              stroke="#0f172a"
              strokeWidth={2}
              className="cursor-pointer transition-all duration-200"
              style={{
                filter: slice.isHovered ? `drop-shadow(0 0 10px ${slice.color}88)` : 'none'
              }}
              onMouseEnter={() => {
                setActiveHoverId(slice.option.id);
                onOptionHover?.(slice.option.id);
              }}
              onMouseLeave={() => {
                setActiveHoverId(null);
                onOptionHover?.(null);
              }}
            />
          ))}
        </svg>

        {/* Center Telemetry Display */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4"
          style={{ width: size, height: size }}
        >
          {activeSlice ? (
            <div className="transition-opacity duration-150">
              <span className="text-2xl font-bold font-mono tabular-nums text-white">
                {activeSlice.percentage}%
              </span>
              <p className="text-[11px] font-medium text-slate-400 truncate max-w-[120px]">
                {activeSlice.count} votes
              </p>
            </div>
          ) : (
            <div className="transition-opacity duration-150">
              <span className="text-3xl font-extrabold font-mono tabular-nums text-white tracking-tight">
                {totalVotes}
              </span>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Total Votes
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
