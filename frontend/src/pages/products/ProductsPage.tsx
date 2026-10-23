import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Package, Plus } from 'lucide-react';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useAuth } from '../../hooks/useAuth';
import { useListParams } from '../../hooks/useListParams';
import { cn } from '../../lib/cn';
import { formatCurrency, formatNumber } from '../../lib/format';
import type { InventorySummary, Product } from '../../types/api';
import { Badge } from '../../components/ui/Badge';
import { ButtonLink } from '../../components/ui/Button';
import { CellStack, DataTable, type Column } from '../../components/ui/DataTable';
import { FilterBar, TogglePill } from '../../components/ui/FilterBar';
import { FilterSelect } from '../../components/ui/Form';
import { PageHeader } from '../../components/ui/PageHeader';
import { Pagination } from '../../components/ui/Pagination';
import { Card, Panel } from '../../components/ui/Surface';
import { ErrorState } from '../../components/ui/States';

const DEFAULTS = {
  page: '1',
  search: '',
  category: '',
  location: '',
  lowStock: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

/** Colour-codes the stock number against the product's own alert level. */
function StockLevel({ product }: { product: Product }) {
  return (
    <div className="flex flex-col items-end">
      <span
        className={cn(
          'text-sm font-bold',
          product.isOutOfStock ? 'text-accent' : product.isLowStock ? 'text-amber-600' : 'text-gray-800',
        )}
      >
        {formatNumber(product.currentStock)}
      </span>
      <span className="text-[10px] text-gray-400">min {formatNumber(product.minStockAlert)}</span>
    </div>
  );
}

export function ProductsPage() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const { values, setValues, reset, hasFilters } = useListParams(DEFAULTS);

  const { data, meta, isLoading, error, refetch } = useApiQuery<Product[]>('/products', {
    page: values.page,
    pageSize: 10,
    search: values.search || undefined,
    category: values.category || undefined,
    location: values.location || undefined,
    lowStock: values.lowStock || undefined,
    sortBy: values.sortBy,
    sortOrder: values.sortOrder,
  });

  const facets = useApiQuery<{ categories: string[]; locations: string[] }>('/products/facets');
  const summary = useApiQuery<InventorySummary>('/inventory/summary');

  const columns: Array<Column<Product>> = [
    {
      key: 'product',
      header: 'Product',
      render: (product) => (
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
            <Package className="h-3.5 w-3.5" />
          </span>
          <CellStack title={product.name} subtitle={product.sku} />
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      hideBelow: 'sm',
      render: (product) => <Badge tone="muted">{product.category}</Badge>,
    },
    {
      key: 'location',
      header: 'Location',
      hideBelow: 'lg',
      render: (product) => <span className="text-[11px] text-gray-500">{product.location}</span>,
    },
    {
      key: 'price',
      header: 'Unit price',
      align: 'right',
      hideBelow: 'md',
      render: (product) => (
        <span className="text-xs font-semibold">{formatCurrency(product.unitPrice)}</span>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      align: 'right',
      render: (product) => <StockLevel product={product} />,
    },
    {
      key: 'value',
      header: 'Stock value',
      align: 'right',
      hideBelow: 'xl',
      render: (product) => (
        <span className="text-xs text-gray-600">{formatCurrency(product.stockValue)}</span>
      ),
    },
    {
      key: 'health',
      header: '',
      align: 'right',
      render: (product) =>
        product.isOutOfStock ? (
          <Badge tone="danger">Out of stock</Badge>
        ) : product.isLowStock ? (
          <Badge tone="warning">Low</Badge>
        ) : (
          <Badge tone="success">Healthy</Badge>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="The catalogue with live stock levels and reorder alerts."
        actions={
          can('product:write') ? (
            <ButtonLink to="/products/new" variant="accent" icon={<Plus className="h-3.5 w-3.5" />}>
              Add product
            </ButtonLink>
          ) : null
        }
      />

      {summary.data ? (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="p-3">
            <p className="text-[10px] font-medium text-gray-400">Products</p>
            <p className="text-xl font-bold">{formatNumber(summary.data.totalProducts)}</p>
          </Card>
          <Card className="p-3">
            <p className="text-[10px] font-medium text-gray-400">Units on hand</p>
            <p className="text-xl font-bold">{formatNumber(summary.data.totalUnits)}</p>
          </Card>
          <Card className="p-3">
            <p className="text-[10px] font-medium text-gray-400">Stock value</p>
            <p className="text-xl font-bold">{formatCurrency(summary.data.stockValue)}</p>
          </Card>
          <Card className="border-pink-200 p-3">
            <p className="text-[10px] font-medium text-gray-400">Needs reorder</p>
            <p className="flex items-center gap-1 text-xl font-bold text-accent">
              <AlertTriangle className="h-4 w-4" />
              {formatNumber(summary.data.lowStockCount)}
            </p>
          </Card>
        </section>
      ) : null}

      <FilterBar
        searchValue={values.search}
        onSearchChange={(search) => setValues({ search })}
        searchPlaceholder="Search product name, SKU or category"
        onClear={reset}
        hasFilters={hasFilters}
      >
        <FilterSelect
          value={values.category}
          onChange={(event) => setValues({ category: event.target.value })}
          options={(facets.data?.categories ?? []).map((value) => ({ value, label: value }))}
          placeholder="All categories"
          aria-label="Filter by category"
          className="w-40"
        />
        <FilterSelect
          value={values.location}
          onChange={(event) => setValues({ location: event.target.value })}
          options={(facets.data?.locations ?? []).map((value) => ({ value, label: value }))}
          placeholder="All locations"
          aria-label="Filter by location"
          className="w-44"
        />
        <TogglePill
          isActive={values.lowStock === 'true'}
          onToggle={() => setValues({ lowStock: values.lowStock === 'true' ? '' : 'true' })}
          count={summary.data?.lowStockCount}
        >
          <AlertTriangle className="h-3 w-3" />
          Low stock
        </TogglePill>
      </FilterBar>

      <Panel className="flex flex-col gap-3">
        {error ? (
          <ErrorState message={error.message} onRetry={refetch} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={data ?? []}
              rowKey={(product) => product.id}
              isLoading={isLoading}
              onRowClick={(product) => navigate(`/products/${product.id}`)}
              emptyTitle={hasFilters ? 'No products match these filters' : 'No products yet'}
              emptyDescription={
                hasFilters
                  ? 'Try a different search term or clear the filters.'
                  : 'Add your first product to start tracking stock.'
              }
              emptyAction={
                can('product:write') && !hasFilters ? (
                  <ButtonLink to="/products/new" variant="accent">
                    Add product
                  </ButtonLink>
                ) : null
              }
              renderCard={(product) => (
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <CellStack title={product.name} subtitle={`${product.sku} · ${product.category}`} />
                    <StockLevel product={product} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>{formatCurrency(product.unitPrice)}</span>
                    {product.isOutOfStock ? (
                      <Badge tone="danger">Out of stock</Badge>
                    ) : product.isLowStock ? (
                      <Badge tone="warning">Low</Badge>
                    ) : (
                      <Badge tone="success">Healthy</Badge>
                    )}
                  </div>
                </div>
              )}
            />

            <Pagination meta={meta} onPageChange={(page) => setValues({ page })} />
          </>
        )}
      </Panel>
    </>
  );
}
