import { useId, useState } from 'react';
import { cn } from '../../lib/cn';
import { formatCompactCurrency } from '../../lib/format';

export interface TrendPoint {
  label: string;
  value: number;
  caption?: string;
}

interface TrendLineChartProps {
  data: TrendPoint[];
  title: string;
  /** Drawn as a dashed neutral reference line, e.g. the period average. */
  baselineLabel?: string;
  height?: number;
  className?: string;
}

const VIEW_WIDTH = 500;
const VIEW_HEIGHT = 120;
const PADDING_Y = 14;

/**
 * Single-measure trend line in the reference's style: a 2px accent stroke over a
 * recessive grid, with a dashed neutral line marking the period average.
 *
 * The average is a reference baseline rather than a second category, so it is
 * distinguished by line style and its own direct label — identity never rests on
 * colour alone. Hovering reveals a crosshair and the exact value.
 */
export function TrendLineChart({
  data,
  title,
  baselineLabel = 'Period average',
  height = 128,
  className,
}: TrendLineChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const tableId = useId();

  if (data.length === 0) return null;

  const values = data.map((point) => point.value);
  const max = Math.max(...values);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;

  const x = (index: number) =>
    data.length === 1 ? VIEW_WIDTH / 2 : (index / (data.length - 1)) * VIEW_WIDTH;
  const y = (value: number) =>
    VIEW_HEIGHT - PADDING_Y - ((value - min) / span) * (VIEW_HEIGHT - PADDING_Y * 2);

  const points = data.map((point, index) => ({ ...point, x: x(index), y: y(point.value) }));
  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L${VIEW_WIDTH},${VIEW_HEIGHT} L0,${VIEW_HEIGHT} Z`;
  const averageY = y(average);

  const active = activeIndex === null ? null : points[activeIndex];
  const gradientId = `trend-fill-${tableId.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <figure className={cn('m-0 flex flex-col gap-2', className)} aria-describedby={tableId}>
      <div className="relative" style={{ height }}>
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          preserveAspectRatio="none"
          className="h-full w-full overflow-visible"
          role="img"
          aria-label={title}
          onMouseLeave={() => setActiveIndex(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E62E6B" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#E62E6B" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Recessive grid */}
          {[0, 0.5, 1].map((step) => (
            <line
              key={step}
              x1={0}
              x2={VIEW_WIDTH}
              y1={PADDING_Y + step * (VIEW_HEIGHT - PADDING_Y * 2)}
              y2={PADDING_Y + step * (VIEW_HEIGHT - PADDING_Y * 2)}
              stroke="rgba(0,0,0,0.07)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}

          <path d={areaPath} fill={`url(#${gradientId})`} />

          {/* Reference baseline — dashed and neutral on purpose */}
          <line
            x1={0}
            x2={VIEW_WIDTH}
            y1={averageY}
            y2={averageY}
            stroke="#9CA3AF"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
          />

          <path
            d={linePath}
            fill="none"
            stroke="#E62E6B"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {active ? (
            <line
              x1={active.x}
              x2={active.x}
              y1={0}
              y2={VIEW_HEIGHT}
              stroke="rgba(0,0,0,0.18)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}

          {points.map((point, index) => (
            <g key={point.label}>
              {activeIndex === index ? (
                <circle cx={point.x} cy={point.y} r={5} fill="#E62E6B" stroke="#fff" strokeWidth={2} />
              ) : null}
              {/* Generous invisible hit area for pointer and keyboard users */}
              <rect
                x={point.x - VIEW_WIDTH / (data.length * 2)}
                y={0}
                width={VIEW_WIDTH / data.length}
                height={VIEW_HEIGHT}
                fill="transparent"
                onMouseEnter={() => setActiveIndex(index)}
              >
                <title>{`${point.label}: ${formatCompactCurrency(point.value)}`}</title>
              </rect>
            </g>
          ))}
        </svg>

        {active ? (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[10px] font-semibold text-gray-800 shadow-md"
            style={{ left: `${(active.x / VIEW_WIDTH) * 100}%` }}
          >
            {active.label}: {formatCompactCurrency(active.value)}
            {active.caption ? (
              <span className="block font-normal text-gray-400">{active.caption}</span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between text-[10px] text-gray-400">
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="h-0.5 w-4 rounded-full bg-accent" />
            Confirmed value
          </span>
          <span className="flex items-center gap-1">
            <span className="h-0 w-4 border-t-2 border-dashed border-gray-400" />
            {baselineLabel} {formatCompactCurrency(average)}
          </span>
        </span>
        <span className="hidden sm:inline">
          {data[0].label} – {data[data.length - 1].label}
        </span>
      </div>

      <table id={tableId} className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">Confirmed value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.label}>
              <th scope="row">{point.label}</th>
              <td>{formatCompactCurrency(point.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
