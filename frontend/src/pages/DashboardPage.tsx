import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  ChevronDown,
  Flame,
  PackageSearch,
  RefreshCw,
  Sparkles,
  Star,
  ThumbsUp,
} from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import { useAuth } from '../hooks/useAuth';
import {
  formatCompactCurrency,
  formatDate,
  formatNumber,
  formatRelativeDay,
  isOverdue,
  splitCurrency,
} from '../lib/format';
import { cn } from '../lib/cn';
import { roleLabel } from '../lib/labels';
import type { DashboardData } from '../types/api';
import { PageHeader, Toolbar } from '../components/ui/PageHeader';
import { AccentCard, Card, InkCard, ListRow, Panel } from '../components/ui/Surface';
import { Badge, ChallanStatusBadge, Chip, CustomerStatusBadge, TrendBadge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Button, ButtonLink, IconButton } from '../components/ui/Button';
import { EmptyState, ErrorState, TableSkeleton } from '../components/ui/States';
import { BarChart } from '../components/charts/BarChart';
import { TrendLineChart } from '../components/charts/TrendLineChart';

const TIMEFRAMES = [
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
  { days: 180, label: 'Last 6 months' },
  { days: 365, label: 'Last 12 months' },
];

export function DashboardPage() {
  const { user } = useAuth();
  const [days, setDays] = useState(90);

  const { data, isLoading, error, refetch } = useApiQuery<DashboardData>('/dashboard', { days });

  const timeframe = TIMEFRAMES.find((entry) => entry.days === days) ?? TIMEFRAMES[1];

  return (
    <>
      {/* Action bar — desks on the left, timeframe and controls on the right */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Toolbar className="gap-1.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-600">
            {data?.customers.total ?? '–'}
          </span>
          {(['SALES', 'WAREHOUSE', 'ACCOUNTS'] as const).map((role) => (
            <span
              key={role}
              className="flex items-center gap-1.5 rounded-full bg-gray-100/70 px-2.5 py-1 text-xs font-medium"
            >
              <Avatar name={roleLabel(role)} size="sm" tone="soft" />
              <span className="hidden sm:inline">{roleLabel(role)}</span>
            </span>
          ))}
          <span className="ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
            {user ? roleLabel(user.role)[0] : 'E'}
          </span>
        </Toolbar>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              aria-label="Reporting timeframe"
              className="appearance-none rounded-full border border-gray-200 bg-white py-1.5 pl-3 pr-8 text-xs font-medium shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black/10"
            >
              {TIMEFRAMES.map((entry) => (
                <option key={entry.days} value={entry.days}>
                  {entry.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-white p-1 shadow-sm">
            <IconButton label="Refresh figures" onClick={refetch} className="p-1">
              <RefreshCw className="h-3.5 w-3.5" />
            </IconButton>
          </div>
        </div>
      </div>

      <PageHeader
        title="Operations overview"
        subtitle={
          data
            ? `Confirmed dispatch value for the ${timeframe.label.toLowerCase()}, compared with the preceding period.`
            : undefined
        }
      />

      {error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : isLoading || !data ? (
        <TableSkeleton rows={8} columns={4} />
      ) : (
        <>
          {/* ---------------------------------------------------------------
              Headline metrics
          --------------------------------------------------------------- */}
          <section className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12">
            <Panel className="flex flex-col justify-between p-5 lg:col-span-5">
              <div>
                <div className="mb-1 text-xs font-semibold text-gray-500">Dispatch revenue</div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {splitCurrency(data.revenue.current).whole}
                    <span className="text-gray-400">{splitCurrency(data.revenue.current).fraction}</span>
                  </span>
                  <TrendBadge value={data.revenue.changePercent} />
                  <Badge tone={data.revenue.changeAmount >= 0 ? 'accent' : 'neutral'}>
                    {data.revenue.changeAmount >= 0 ? '+' : '−'}
                    {formatCompactCurrency(Math.abs(data.revenue.changeAmount))}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center gap-1 text-[11px] text-gray-400">
                  vs previous {formatCompactCurrency(data.revenue.previous)} from{' '}
                  {formatDate(data.revenue.previousPeriodStart)}
                </div>
              </div>

              {/* Contribution strip — the reference's sub-metric row */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200/60 pt-4 text-xs">
                {data.topCustomers.length === 0 ? (
                  <span className="text-[11px] text-gray-400">
                    No confirmed challans in this period yet.
                  </span>
                ) : (
                  data.topCustomers.slice(0, 3).map((customer) => (
                    <div key={customer.id} className="flex items-center gap-1.5">
                      <Avatar name={customer.businessName} size="sm" tone="soft" />
                      <span className="font-bold">{formatCompactCurrency(customer.revenue)}</span>
                      <span className="text-[11px] text-gray-400">{customer.share}%</span>
                    </div>
                  ))
                )}
                <ButtonLink to="/challans?status=CONFIRMED" variant="primary" size="xs">
                  Details
                </ButtonLink>
              </div>
            </Panel>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:col-span-7">
              <Card className="flex flex-col justify-between">
                <div className="text-[11px] font-medium text-gray-400">Confirmed challans</div>
                <div className="my-1 text-2xl font-bold">{formatNumber(data.revenue.challanCount)}</div>
                <Link
                  to="/challans?status=CONFIRMED"
                  className="mt-2 flex items-center justify-between rounded-lg bg-gray-50 p-1.5 text-xs font-semibold transition hover:bg-gray-100"
                >
                  <span className="truncate text-[11px]">
                    {formatNumber(data.revenue.unitsDispatched)} units
                  </span>
                  <ChevronDown className="h-3 w-3 -rotate-90 text-gray-400" />
                </Link>
              </Card>

              <InkCard className="flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span>Top account</span>
                  <Star className="h-3 w-3" />
                </div>
                <div className="my-1 text-lg font-bold">
                  {data.topCustomers[0] ? formatCompactCurrency(data.topCustomers[0].revenue) : '—'}
                </div>
                <div className="mt-2 flex items-center justify-between rounded-lg bg-zinc-800/80 p-1.5 text-xs">
                  <span className="truncate text-[11px] font-medium">
                    {data.topCustomers[0]?.businessName ?? 'No dispatches yet'}
                  </span>
                  <ChevronDown className="h-3 w-3 -rotate-90 shrink-0 text-gray-400" />
                </div>
              </InkCard>

              <Card className="flex flex-col p-3.5 text-center">
                <div className="text-[11px] font-medium text-gray-400">Stock on hand</div>
                <div className="my-1 text-2xl font-bold">
                  {formatNumber(data.inventory.totalUnits)}
                </div>
                <div className="mt-auto rounded-lg bg-gray-100 py-1 text-[11px] font-semibold text-gray-600">
                  {formatCompactCurrency(data.inventory.stockValue)} value
                </div>
              </Card>

              <div className="flex flex-col justify-between gap-2">
                <Link
                  to="/products?lowStock=true"
                  className="flex items-center justify-between rounded-2xl border border-pink-200 bg-white p-2.5 shadow-sm transition hover:border-accent"
                >
                  <div>
                    <div className="text-[10px] font-medium text-gray-400">Low stock</div>
                    <div className="flex items-center gap-0.5 text-[10px] font-bold text-accent">
                      <AlertTriangle className="h-2.5 w-2.5" /> needs reorder
                    </div>
                  </div>
                  <div className="rounded-md bg-accent px-2 py-1 text-xs font-bold text-white">
                    {data.inventory.lowStockCount}
                  </div>
                </Link>

                <Link
                  to="/customers?followUpDue=true"
                  className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-2.5 shadow-sm transition hover:border-gray-300"
                >
                  <div>
                    <div className="text-[10px] font-medium text-gray-400">Follow-ups</div>
                    <div className="flex items-center gap-0.5 text-[10px] font-bold text-gray-600">
                      <CalendarClock className="h-2.5 w-2.5" /> due now
                    </div>
                  </div>
                  <div className="rounded-md bg-gray-200 px-2 py-1 text-xs font-bold text-gray-600">
                    {data.customers.followUpsDue}
                  </div>
                </Link>
              </div>
            </div>
          </section>

          {/* ---------------------------------------------------------------
              Breakdown widgets
          --------------------------------------------------------------- */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <Panel className="flex flex-col justify-between lg:col-span-4">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full border border-gray-200 bg-white/80 px-2.5 py-1 text-xs font-semibold">
                    Top customers
                  </span>
                  <Link
                    to="/customers"
                    className="rounded-full border border-gray-200 bg-white/80 px-3 py-1 text-xs font-medium text-gray-600 transition hover:bg-white"
                  >
                    View all
                  </Link>
                </div>

                {data.topCustomers.length === 0 ? (
                  <EmptyState title="No dispatches in this period" className="py-6" />
                ) : (
                  <div className="space-y-2">
                    {data.topCustomers.map((customer) => (
                      <ListRow key={customer.id}>
                        <Link
                          to={`/customers/${customer.id}`}
                          className="flex min-w-0 items-center gap-2"
                        >
                          <Avatar name={customer.businessName} size="sm" tone="accent" />
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-semibold">
                              {customer.businessName}
                            </span>
                            <span className="block truncate text-[10px] text-gray-400">
                              {customer.challanCount} challan{customer.challanCount === 1 ? '' : 's'}
                            </span>
                          </span>
                        </Link>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-xs font-bold">
                            {formatCompactCurrency(customer.revenue)}
                          </span>
                          <Chip>{customer.share}%</Chip>
                        </div>
                      </ListRow>
                    ))}
                  </div>
                )}
              </div>
            </Panel>

            <Panel className="flex flex-col justify-between lg:col-span-3">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-full border border-gray-200 bg-white/80 px-2.5 py-1 text-xs font-semibold">
                    Best sellers
                  </span>
                  <Link
                    to="/products"
                    className="rounded-full border border-gray-200 bg-white/80 px-3 py-1 text-xs font-medium text-gray-600 transition hover:bg-white"
                  >
                    Catalogue
                  </Link>
                </div>

                {data.topProducts.length === 0 ? (
                  <EmptyState title="Nothing dispatched yet" className="py-6" />
                ) : (
                  <BarChart
                    title="Revenue by product for the selected period"
                    data={data.topProducts.slice(0, 4).map((product) => ({
                      label: product.sku.split('-')[1] ?? product.sku,
                      value: product.revenue,
                      caption: `${product.name} · ${formatNumber(product.quantity)} units`,
                    }))}
                  />
                )}
              </div>

              <div className="flex items-center justify-between border-t border-gray-200/60 pt-2 text-[11px] font-semibold text-gray-600">
                <span>
                  Dispatch value
                  <span className="block font-normal text-gray-400">by product</span>
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </div>
            </Panel>

            <Panel className="flex flex-col justify-between gap-4 lg:col-span-5">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full min-w-[360px] border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200/60 text-[11px] font-semibold text-gray-500">
                      <th scope="col" className="pb-2 text-left">Desk</th>
                      <th scope="col" className="pb-2 text-right">Value</th>
                      <th scope="col" className="pb-2 text-right">Challans</th>
                      <th scope="col" className="pb-2 text-right">Units</th>
                      <th scope="col" className="pb-2 text-right">Confirmed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.salesPerformance.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-[11px] text-gray-400">
                          No challans raised in this period.
                        </td>
                      </tr>
                    ) : (
                      data.salesPerformance.map((entry) => (
                        <tr key={entry.id} className="text-xs font-medium">
                          <td className="py-2">
                            <span className="flex items-center gap-1.5">
                              <Avatar name={entry.name} size="sm" tone="soft" />
                              <span className="truncate">{entry.name}</span>
                            </span>
                          </td>
                          <td className="py-2 text-right font-bold">
                            {formatCompactCurrency(entry.revenue)}
                          </td>
                          <td className="py-2 text-right">
                            <span className="rounded-full bg-black px-1.5 py-0.5 text-[10px] text-white">
                              {entry.challanCount}
                            </span>
                          </td>
                          <td className="py-2 text-right">{formatNumber(entry.quantity)}</td>
                          <td className="py-2 text-right">
                            {entry.conversionRate}%
                            <span className="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                              {entry.confirmed}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <PillStat icon={<Sparkles className="h-3 w-3 text-amber-500" />}>
                  {data.challans.confirmed.count} confirmed
                </PillStat>
                <PillStat icon={<Flame className="h-3 w-3 text-orange-500" />}>
                  {data.challans.draft.count} drafts open
                </PillStat>
                <PillStat icon={<ThumbsUp className="h-3 w-3 text-emerald-500" />}>
                  {data.customers.active} active accounts
                </PillStat>
              </div>

              <div className="relative flex items-center justify-between overflow-hidden rounded-xl border border-gray-100 bg-white/70 p-3">
                <div>
                  <div className="text-[10px] font-medium text-gray-400">Catalogue coverage</div>
                  <div className="mt-2 text-xl font-bold">
                    {data.inventory.totalProducts - data.inventory.lowStockCount}
                    <span className="text-sm text-gray-300">/{data.inventory.totalProducts}</span>
                  </div>
                  <div className="text-[10px] text-gray-400">products above their alert level</div>
                </div>

                <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  {data.inventory.outOfStockCount} out of stock
                </div>

                <div className="mt-4 flex flex-col gap-1 text-[10px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" /> Healthy
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-400" /> Low {data.inventory.lowStockCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-accent" /> Empty {data.inventory.outOfStockCount}
                  </span>
                </div>
              </div>
            </Panel>
          </section>

          {/* ---------------------------------------------------------------
              Trend row
          --------------------------------------------------------------- */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <AccentCard className="relative flex gap-4 lg:col-span-5">
              <div className="flex w-28 shrink-0 flex-col justify-center gap-3 border-r border-white/20 pr-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                  Monthly average
                </span>
                <div>
                  <div className="text-[10px] opacity-80">Revenue</div>
                  <div className="text-sm font-bold">
                    {formatCompactCurrency(monthlyAverage(data.monthlyRevenue.map((m) => m.revenue)))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] opacity-80">Units</div>
                  <div className="text-sm font-bold">
                    {formatNumber(Math.round(monthlyAverage(data.monthlyRevenue.map((m) => m.quantity))))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] opacity-80">Challans</div>
                  <div className="text-sm font-bold">
                    {data.challans.confirmed.count}
                    <span className="ml-1 text-[10px] font-normal opacity-80">
                      /{data.challans.total}
                    </span>
                  </div>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <BarChart
                  title="Confirmed dispatch value for the last three months"
                  tone="inverse"
                  data={data.monthlyRevenue.slice(-3).map((month) => ({
                    label: month.label,
                    value: month.revenue,
                    caption: `${month.challanCount} challan${month.challanCount === 1 ? '' : 's'} · ${formatNumber(month.quantity)} units`,
                  }))}
                />
              </div>
            </AccentCard>

            <Panel className="flex flex-col justify-between lg:col-span-7">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-gray-700">Dispatch dynamic</div>
                <ArrowUpRight className="h-4 w-4 text-gray-400" />
              </div>

              <TrendLineChart
                title="Confirmed dispatch value by month"
                data={data.monthlyRevenue.map((month) => ({
                  label: month.label,
                  value: month.revenue,
                  caption: `${month.challanCount} challan${month.challanCount === 1 ? '' : 's'}`,
                }))}
              />

              <div className="border-t border-gray-200/60 pt-2">
                {data.recentChallans.length === 0 ? (
                  <p className="text-[11px] text-gray-400">No challans raised yet.</p>
                ) : (
                  <Link
                    to={`/challans/${data.recentChallans[0].id}`}
                    className="flex items-center justify-between gap-2 text-xs font-medium transition hover:text-accent"
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Avatar name={data.recentChallans[0].createdBy.name} size="sm" tone="soft" />
                      <span className="truncate">{data.recentChallans[0].customer.businessName}</span>
                    </span>
                    <span className="font-bold">
                      {formatCompactCurrency(data.recentChallans[0].totalAmount)}
                    </span>
                    <span className="rounded-full bg-black px-1.5 py-0.5 text-[10px] text-white">
                      {data.recentChallans[0].totalQuantity}
                    </span>
                    <ChallanStatusBadge status={data.recentChallans[0].status} />
                  </Link>
                )}
              </div>
            </Panel>
          </section>

          {/* ---------------------------------------------------------------
              Operational worklists
          --------------------------------------------------------------- */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">Low stock alerts</span>
                <ButtonLink to="/products?lowStock=true" variant="outline" size="xs">
                  Reorder list
                </ButtonLink>
              </div>

              {data.lowStockProducts.length === 0 ? (
                <EmptyState
                  icon={<PackageSearch className="h-5 w-5" />}
                  title="Every product is above its alert level"
                  className="py-6"
                />
              ) : (
                <div className="space-y-2">
                  {data.lowStockProducts.map((product) => (
                    <ListRow key={product.id}>
                      <Link to={`/products/${product.id}`} className="min-w-0">
                        <span className="block truncate text-xs font-semibold">{product.name}</span>
                        <span className="block truncate text-[10px] text-gray-400">
                          {product.sku} · {product.location}
                        </span>
                      </Link>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={cn(
                            'text-xs font-bold',
                            product.currentStock === 0 ? 'text-accent' : 'text-amber-600',
                          )}
                        >
                          {formatNumber(product.currentStock)}
                        </span>
                        <Chip tone="muted">min {product.minStockAlert}</Chip>
                      </div>
                    </ListRow>
                  ))}
                </div>
              )}
            </Panel>

            <Panel className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">Upcoming follow-ups</span>
                <ButtonLink to="/customers?followUpDue=true" variant="outline" size="xs">
                  Due now
                </ButtonLink>
              </div>

              {data.upcomingFollowUps.length === 0 ? (
                <EmptyState
                  icon={<CalendarClock className="h-5 w-5" />}
                  title="No follow-ups scheduled"
                  className="py-6"
                />
              ) : (
                <div className="space-y-2">
                  {data.upcomingFollowUps.map((customer) => (
                    <ListRow key={customer.id}>
                      <Link to={`/customers/${customer.id}`} className="flex min-w-0 items-center gap-2">
                        <Avatar name={customer.businessName} size="sm" tone="soft" />
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-semibold">
                            {customer.businessName}
                          </span>
                          <span className="block truncate text-[10px] text-gray-400">
                            {customer.name} · {customer.mobile}
                          </span>
                        </span>
                      </Link>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={cn(
                            'text-[10px] font-semibold',
                            isOverdue(customer.followUpDate) ? 'text-accent' : 'text-gray-500',
                          )}
                        >
                          {formatRelativeDay(customer.followUpDate)}
                        </span>
                        <CustomerStatusBadge status={customer.status} />
                      </div>
                    </ListRow>
                  ))}
                </div>
              )}
            </Panel>
          </section>

          <div className="flex justify-center pt-1">
            <Button variant="ghost" size="xs" onClick={refetch} icon={<RefreshCw className="h-3 w-3" />}>
              Refresh figures
            </Button>
          </div>
        </>
      )}
    </>
  );
}

function PillStat({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1 rounded-full border border-gray-200 bg-white/80 px-2.5 py-1 text-[10px] font-semibold">
      {children} {icon}
    </span>
  );
}

const monthlyAverage = (values: number[]) =>
  values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
