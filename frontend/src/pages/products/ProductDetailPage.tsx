import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftRight, MapPin, Package, Pencil, Tag } from 'lucide-react';
import { cn } from '../../lib/cn';
import { formatCurrency, formatDateTime, formatNumber } from '../../lib/format';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useAuth } from '../../hooks/useAuth';
import type { ProductDetail } from '../../types/api';
import { Badge, MovementBadge } from '../../components/ui/Badge';
import { Button, ButtonLink } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, Panel } from '../../components/ui/Surface';
import { EmptyState, ErrorState, LoadingBlock } from '../../components/ui/States';
import { StockMovementDialog } from '../../components/inventory/StockMovementDialog';
import { Avatar } from '../../components/ui/Avatar';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { can } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isLoading, error, refetch } = useApiQuery<ProductDetail>(`/products/${id}`);

  if (isLoading) return <LoadingBlock label="Loading product" />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!data) return null;

  return (
    <>
      <PageHeader
        title={data.name}
        backTo="/products"
        backLabel="Back to products"
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-gray-600">{data.sku}</span>
            <Badge tone="muted">{data.category}</Badge>
            {!data.isActive ? <Badge tone="danger">Discontinued</Badge> : null}
          </span>
        }
        actions={
          <>
            {can('inventory:write') ? (
              <Button
                variant="outline"
                icon={<ArrowLeftRight className="h-3.5 w-3.5" />}
                onClick={() => setIsDialogOpen(true)}
              >
                Adjust stock
              </Button>
            ) : null}
            {can('product:write') ? (
              <ButtonLink
                to={`/products/${data.id}/edit`}
                variant="accent"
                icon={<Pencil className="h-3.5 w-3.5" />}
              >
                Edit
              </ButtonLink>
            ) : null}
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className={cn('p-3', data.isLowStock && 'border-pink-200')}>
          <p className="text-[10px] font-medium text-gray-400">Current stock</p>
          <p
            className={cn(
              'text-2xl font-bold',
              data.isOutOfStock ? 'text-accent' : data.isLowStock ? 'text-amber-600' : 'text-gray-800',
            )}
          >
            {formatNumber(data.currentStock)}
          </p>
          <p className="text-[10px] text-gray-400">alert below {formatNumber(data.minStockAlert)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] font-medium text-gray-400">Unit price</p>
          <p className="text-2xl font-bold">{formatCurrency(data.unitPrice)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] font-medium text-gray-400">Stock value</p>
          <p className="text-2xl font-bold">{formatCurrency(data.stockValue)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] font-medium text-gray-400">Health</p>
          <p className="mt-2">
            {data.isOutOfStock ? (
              <Badge tone="danger">Out of stock</Badge>
            ) : data.isLowStock ? (
              <Badge tone="warning">Reorder soon</Badge>
            ) : (
              <Badge tone="success">Healthy</Badge>
            )}
          </p>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Panel className="flex flex-col gap-3 lg:col-span-4">
          <span className="text-xs font-semibold text-gray-700">Catalogue details</span>

          <div className="flex flex-col gap-2 text-xs">
            <InfoRow icon={<Package className="h-3.5 w-3.5" />} label="SKU" value={data.sku} />
            <InfoRow icon={<Tag className="h-3.5 w-3.5" />} label="Category" value={data.category} />
            <InfoRow
              icon={<MapPin className="h-3.5 w-3.5" />}
              label="Location"
              value={data.location}
            />
          </div>

          <div className="rounded-xl border border-gray-100 bg-white/80 p-3 text-[11px] text-gray-500">
            Added by{' '}
            <span className="font-semibold text-gray-700">{data.createdBy.name}</span> on{' '}
            {formatDateTime(data.createdAt)}
          </div>
        </Panel>

        <Panel className="flex flex-col gap-3 lg:col-span-8">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">Stock movement history</span>
            <ButtonLink to={`/inventory?productId=${data.id}`} variant="outline" size="xs">
              Full ledger
            </ButtonLink>
          </div>

          {data.stockMovements.length === 0 ? (
            <EmptyState
              icon={<ArrowLeftRight className="h-5 w-5" />}
              title="No movements recorded"
              description="Stock changes made here or by confirming a challan will show up in this ledger."
              className="py-6"
            />
          ) : (
            <ol className="flex flex-col gap-2">
              {data.stockMovements.map((movement) => (
                <li
                  key={movement.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 bg-white/80 px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <MovementBadge type={movement.type} />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-gray-800">
                        {movement.reason}
                      </p>
                      <p className="flex items-center gap-1 truncate text-[10px] text-gray-400">
                        <Avatar name={movement.createdBy.name} size="xs" tone="soft" />
                        {movement.createdBy.name} · {formatDateTime(movement.createdAt)}
                        {movement.challan ? (
                          <>
                            {' · '}
                            <Link
                              to={`/challans/${movement.challan.id}`}
                              className="font-semibold text-accent hover:underline"
                            >
                              {movement.challan.challanNumber}
                            </Link>
                          </>
                        ) : null}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={cn(
                        'text-xs font-bold',
                        movement.type === 'IN' ? 'text-emerald-600' : 'text-accent',
                      )}
                    >
                      {movement.type === 'IN' ? '+' : '−'}
                      {formatNumber(movement.quantity)}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      balance {formatNumber(movement.balanceAfter)}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </section>

      <StockMovementDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onRecorded={refetch}
        product={data}
      />
    </>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-gray-100 bg-white/80 px-3 py-2">
      <span className="mt-0.5 text-gray-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <p className="break-words text-xs text-gray-700">{value}</p>
      </div>
    </div>
  );
}
