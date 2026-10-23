const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('en-IN');

/** ₹1,23,456.78 — the decimals are rendered separately by some cards. */
export const formatCurrency = (value: number) => currencyFormatter.format(value);

/** Splits money into whole and decimal parts so the UI can de-emphasise paise. */
export const splitCurrency = (value: number) => {
  const formatted = currencyFormatter.format(value);
  const separator = formatted.lastIndexOf('.');

  return separator === -1
    ? { whole: formatted, fraction: '' }
    : { whole: formatted.slice(0, separator), fraction: formatted.slice(separator) };
};

/** Compact money for tight card layouts: ₹5.3L, ₹28.4K. */
export const formatCompactCurrency = (value: number) => {
  const abs = Math.abs(value);

  if (abs >= 10_000_000) return `₹${(value / 10_000_000).toFixed(1)}Cr`;
  if (abs >= 100_000) return `₹${(value / 100_000).toFixed(1)}L`;
  if (abs >= 1_000) return `₹${(value / 1_000).toFixed(1)}K`;

  return `₹${Math.round(value)}`;
};

export const formatNumber = (value: number) => numberFormatter.format(value);

export const formatPercent = (value: number, digits = 1) =>
  `${value > 0 ? '' : ''}${value.toFixed(digits)}%`;

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatDate = (value: string | Date | null | undefined) =>
  value ? dateFormatter.format(new Date(value)) : '—';

export const formatDateTime = (value: string | Date | null | undefined) =>
  value ? dateTimeFormatter.format(new Date(value)) : '—';

/** `YYYY-MM-DD` for date inputs. */
export const toDateInputValue = (value: string | Date | null | undefined) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toISOString().slice(0, 10);
};

/** "in 3 days" / "2 days ago" — used for follow-up urgency. */
export const formatRelativeDay = (value: string | Date | null | undefined) => {
  if (!value) return '—';

  const target = new Date(value);
  target.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';

  return days > 0 ? `in ${days} days` : `${Math.abs(days)} days overdue`;
};

export const isOverdue = (value: string | Date | null | undefined) => {
  if (!value) return false;

  const target = new Date(value);
  target.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return target.getTime() < today.getTime();
};

/** Two letter monogram used by avatars throughout the app. */
export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

export const titleCase = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

/** "1 challan" / "3 challans" — avoids the "1 challans" sloppiness. */
export const pluralise = (count: number, singular: string, plural = `${singular}s`) =>
  `${formatNumber(count)} ${count === 1 ? singular : plural}`;
