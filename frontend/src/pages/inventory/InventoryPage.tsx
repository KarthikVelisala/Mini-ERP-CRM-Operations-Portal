import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/cn';
import { formatCurrency, formatDateTime, formatNumber } from '../../lib/format';
import { MOVEMENT_TYPE_OPTIONS } from '../../lib/labels';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useAuth } from '../../hooks/useAuth';
import { useListParams } from '../../hooks/useListParams';
import type { InventorySummary, Product, StockMovement } from '../../types/api';
import { Avatar } from '../../components/ui/Avatar';
import { MovementBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { CellStack, DataTable, type Column } from '../../components/ui/DataTable';
import { FilterBar } from '../../components/ui/FilterBar';
import { FilterSelect, TextInput } from '../../components/ui/Form';
import { PageHeader } from '../../components/ui/PageHeader';
import { Pagination } from '../../components/ui/Pagination';
import { Card, Panel } from '../../components/ui/Surface';
import { ErrorState } from '../../components/ui/States';
import { StockMovementDialog } from '../../components/inventory/StockMovementDialog';

const DEFAULTS = {
  page: '1',
  search: '',
  productId: '',
  type: '',
  from: '',
  to: '',
};

export function InventoryPage() {
  const { can } = useAuth();
  const { values, setValues, reset, hasFilters } = useListParams(DEFAULTS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, meta, isLoading, error, refetch } = useApiQuery<StockMovement[]>(
    '/inventory/movements',
    {
      page: values.page,
      pageSize: 15,
      search: values.search || undefined,
      productId: values.productId || undefined,
      type: values.type || undefined,
      from: values.from || undefined,
      to: values.to || undefined,
    },
  );

  const summary = useApiQuery<InventorySummary>('/inventory/summary');
  // A modest page is enough to populate the product filter and the dialog picker.
  const products = useApiQuery<Product[]>('/products', { pageSize: 100, sortBy: 'name', sortOrder: 'asc' });

  const refreshAll = () => {
    refetch();
    summary.refetch();
    products.refetch();
  };

  const columns: Array<Column<StockMovement>> = [
    {
      key: 'movement',
      header: 'Movement',
      render: (movement) => (
        <div className="flex items-center gap-2">
          <MovementBadge type={movement.type} />
          <CellStack title={movement.reason} />
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      render: (movement) => (
        <Link to={`/products/${movement.product.id}`} className="hover:text-accent">
          <CellStack title={movement.product.name} subtitle={movement.product.sku} />
        </Link>
      ),
    },
    {
      key: 'challan',
      header: 'Source',
      hideBelow: 'lg',
      render: (movement) =>
        movement.challan ? (
          <Link
            to={`/challans/${movement.challan.id}`}
            className="text-[11px] font-semibold text-accent hover:underline"
          >
            {movement.challan.challanNumber}
          </Link>
        ) : (
          <span className="text-[11px] text-gray-400">Manual</span>
        ),
    },
    {
      key: 'quantity',
      header: 'Quantity',
      align: 'right',
      render: (movement) => (
        <span
          className={cn(
            'text-sm font-bold',
            movement.type === 'IN' ? 'text-emerald-600' : 'text-accent',
          )}
        >
          {movement.type === 'IN' ? '+' : '−'}
          {formatNumber(movement.quantity)}
        </span>
      ),
    },
    {
      key: 'balance',
      header: 'Balance after',
      align: 'right',
      hideBelow: 'md',
      render: (movement) => (
        <span className="text-xs text-gray-600">{formatNumber(movement.balanceAfter)}</span>
      ),
    },
    {
      key: 'when',
      header: 'Recorded',
      align: 'right',
      hideBelow: 'xl',
      render: (movement) => (
        <span className="text-[11px] text-gray-500">
          {formatDateTime(movement.createdAt)}
          <span className="mt-0.5 flex items-center justify-end gap-1 text-gray-400">
            <Avatar name={movement.createdBy.name} size="xs" tone="soft" />
            {movement.createdBy.name}
          </span>
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Stock movements"
        subtitle="Every change to stock, whether adjusted by hand or driven by a confirmed challan."
        actions={
          can('inventory:write') ? (
            <Button
              variant="accent"
              icon={<ArrowLeftRight className="h-3.5 w-3.5" />}
              onClick={() => setIsDialogOpen(true)}
            >
              Record movement
            </Button>
          ) : null
        }
      />

      {summary.data ? (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="p-3">
            <p className="text-[10px] font-medium text-gray-400">Units on hand</p>
            <p className="text-xl font-bold">{formatNumber(summary.data.totalUnits)}</p>
          </Card>
          <Card className="p-3">
            <p className="text-[10px] font-medium text-gray-400">Stock value</p>
            <p className="text-xl font-bold">{formatCurrency(summary.data.stockValue)}</p>
          </Card>
          <Card className="p-3">
            <p className="text-[10px] font-medium text-gray-400">In today</p>
            <p className="flex items-center gap-1 text-xl font-bold text-emerald-600">
              <TrendingUp className="h-4 w-4" />
              {formatNumber(summary.data.today.quantityIn)}
            </p>
          </Card>
          <Card className="p-3">
            <p className="text-[10px] font-medium text-gray-400">Out today</p>
            <p className="flex items-center gap-1 text-xl font-bold text-accent">
              <TrendingDown className="h-4 w-4" />
              {formatNumber(summary.data.today.quantityOut)}
            </p>
          </Card>
        </section>
      ) : null}

      <FilterBar
        searchValue={values.search}
        onSearchChange={(search) => setValues({ search })}
        searchPlaceholder="Search reason, product name or SKU"
        onClear={reset}
        hasFilters={hasFilters}
      >
        <FilterSelect
          value={values.productId}
          onChange={(event) => setValues({ productId: event.target.value })}
          options={(products.data ?? []).map((product) => ({
            value: product.id,
            label: `${product.name} (${product.sku})`,
          }))}
          placeholder="All products"
          aria-label="Filter by product"
          className="w-52"
        />
        <FilterSelect
          value={values.type}
          onChange={(event) => setValues({ type: event.target.value })}
          options={MOVEMENT_TYPE_OPTIONS}
          placeholder="IN and OUT"
          aria-label="Filter by movement type"
          className="w-36"
        />
        <div className="flex items-end gap-2">
          <TextInput
            label="From"
            type="date"
            className="w-36"
            value={values.from}
            onChange={(event) => setValues({ from: event.target.value })}
          />
          <TextInput
            label="To"
            type="date"
            className="w-36"
            value={values.to}
            onChange={(event) => setValues({ to: event.target.value })}
          />
        </div>
      </FilterBar>

      <Panel className="flex flex-col gap-3">
        {error ? (
          <ErrorState message={error.message} onRetry={refetch} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={data ?? []}
              rowKey={(movement) => movement.id}
              isLoading={isLoading}
              emptyTitle={hasFilters ? 'No movements match these filters' : 'No stock movements yet'}
              emptyDescription={
                hasFilters
                  ? 'Try widening the date range or clearing the filters.'
                  : 'Movements appear once stock is received or a challan is confirmed.'
              }
              renderCard={(movement) => (
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <CellStack title={movement.product.name} subtitle={movement.product.sku} />
                    <span
                      className={cn(
                        'text-sm font-bold',
                        movement.type === 'IN' ? 'text-emerald-600' : 'text-accent',
                      )}
                    >
                      {movement.type === 'IN' ? '+' : '−'}
                      {formatNumber(movement.quantity)}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">{movement.reason}</p>
                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <MovementBadge type={movement.type} />
                    <span>balance {formatNumber(movement.balanceAfter)}</span>
                  </div>
                </div>
              )}
            />

            <Pagination meta={meta} onPageChange={(page) => setValues({ page })} />
          </>
        )}
      </Panel>

      <StockMovementDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onRecorded={refreshAll}
        products={products.data ?? []}
      />
    </>
  );
}
