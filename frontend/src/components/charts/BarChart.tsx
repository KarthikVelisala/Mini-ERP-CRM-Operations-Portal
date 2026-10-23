import { useId, useState } from 'react';
import { cn } from '../../lib/cn';
import { formatCompactCurrency, formatNumber } from '../../lib/format';

export interface BarDatum {
  label: string;
  value: number;
  /** Optional caption shown in the tooltip, e.g. the number of challans. */
  caption?: string;
}

interface BarChartProps {
  data: BarDatum[];
  /** How the value is rendered in labels and tooltips. */
  format?: 'currency' | 'number';
  /** `ink` for the light panels, `inverse` for the accent-filled card. */
  tone?: 'ink' | 'inverse';
  height?: number;
  className?: string;
  /** Accessible description of what the bars show. */
  title: string;
}

/**
 * Vertical bars in the reference's style: thin columns, rounded tops anchored to
 * the baseline, a 2px surface gap between neighbours and recessive labels.
 *
 * One measure, one hue — magnitude only, so there is no categorical palette and
 * no legend. The hovered bar is direct-labelled instead of numbering every bar.
 */
export function BarChart({
  data,
  format = 'currency',
  tone = 'ink',
  height = 128,
  className,
  title,
}: BarChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const tableId = useId();

  const max = Math.max(...data.map((entry) => entry.value), 0);
  const formatValue = (value: number) =>
    format === 'currency' ? formatCompactCurrency(value) : formatNumber(value);

  const isInverse = tone === 'inverse';
  const active = activeIndex === null ? null : data[activeIndex];

  return (
    <figure className={cn('m-0 flex flex-col gap-2', className)} aria-describedby={tableId}>
      <div
        className="relative flex items-end justify-between gap-2 px-1"
        style={{ height }}
        role="img"
        aria-label={title}
      >
        {data.map((entry, index) => {
          // A visible stub keeps empty periods readable instead of vanishing.
          const ratio = max === 0 ? 0 : entry.value / max;
          const barHeight = Math.max(ratio * (height - 34), entry.value > 0 ? 6 : 3);
          const isActive = activeIndex === index;

          return (
            <button
              key={entry.label}
              type="button"
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onFocus={() => setActiveIndex(index)}
              onBlur={() => setActiveIndex(null)}
              aria-label={`${entry.label}: ${formatValue(entry.value)}`}
              className="group flex h-full flex-1 flex-col items-center justify-end gap-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-black/15"
            >
              <span
                className={cn(
                  'text-[9px] font-semibold transition-opacity',
                  isActive ? 'opacity-100' : 'opacity-0',
                  isInverse ? 'text-white' : 'text-gray-600',
                )}
              >
                {formatValue(entry.value)}
              </span>
              <span
                className={cn(
                  'w-full max-w-[26px] rounded-t-[4px] transition-colors',
                  isInverse
                    ? isActive
                      ? 'bg-white'
                      : 'bg-white/45'
                    : isActive
                      ? 'bg-accent'
                      : 'bg-gray-200',
                )}
                style={{ height: barHeight }}
              />
              <span
                className={cn(
                  'text-[10px]',
                  isInverse ? 'text-white/80' : 'text-gray-400',
                  isActive && (isInverse ? 'text-white' : 'text-gray-700'),
                )}
              >
                {entry.label}
              </span>
            </button>
          );
        })}
      </div>

      {active?.caption ? (
        <figcaption
          className={cn('text-center text-[10px]', isInverse ? 'text-white/80' : 'text-gray-400')}
        >
          {active.caption}
        </figcaption>
      ) : null}

      {/* Table view keeps the values reachable without hovering. */}
      <table id={tableId} className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry) => (
            <tr key={entry.label}>
              <th scope="row">{entry.label}</th>
              <td>{formatValue(entry.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
