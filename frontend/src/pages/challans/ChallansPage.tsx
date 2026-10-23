import { useNavigate } from 'react-router-dom';
import { Plus, Receipt } from 'lucide-react';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useAuth } from '../../hooks/useAuth';
import { useListParams } from '../../hooks/useListParams';
import { formatCurrency, formatDate, formatNumber, pluralise } from '../../lib/format';
import { CHALLAN_STATUS_OPTIONS } from '../../lib/labels';
import type { Challan, ChallanStatus, Customer } from '../../types/api';
import { Avatar } from '../../components/ui/Avatar';
import { ChallanStatusBadge } from '../../components/ui/Badge';
import { ButtonLink } from '../../components/ui/Button';
import { CellStack, DataTable, type Column } from '../../components/ui/DataTable';
import { FilterBar } from '../../components/ui/FilterBar';
import { FilterSelect, TextInput } from '../../components/ui/Form';
import { PageHeader } from '../../components/ui/PageHeader';
import { Pagination } from '../../components/ui/Pagination';
import { Card, Panel } from '../../components/ui/Surface';
import { ErrorState } from '../../components/ui/States';

const DEFAULTS = {
  page: '1',
  search: '',
  status: '',
  customerId: '',
  from: '',
  to: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

interface ChallanSummary {
  byStatus: Record<ChallanStatus, { count: number; totalAmount: number; totalQuantity: number }>;
  totalChallans: number;
  confirmedValue: number;
}

export function ChallansPage() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const { values, setValues, reset, hasFilters } = useListParams(DEFAULTS);

  const { data, meta, isLoading, error, refetch } = useApiQuery<Challan[]>('/challans', {
    page: values.page,
    pageSize: 10,
    search: values.search || undefined,
    status: values.status || undefined,
    customerId: values.customerId || undefined,
    from: values.from || undefined,
    to: values.to || undefined,
    sortBy: values.sortBy,
    sortOrder: values.sortOrder,
  });

  const summary = useApiQuery<ChallanSummary>('/challans/summary');
  const customers = useApiQuery<Customer[]>('/customers', {
    pageSize: 100,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const columns: Array<Column<Challan>> = [
    {
      key: 'challan',
      header: 'Challan',
      render: (challan) => (
        <CellStack title={challan.challanNumber} subtitle={formatDate(challan.createdAt)} />
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (challan) => (
        <div className="flex items-center gap-2">
          <Avatar name={challan.customer.businessName} size="md" tone="soft" />
          <CellStack title={challan.customer.businessName} subtitle={challan.customer.name} />
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      align: 'right',
      hideBelow: 'md',
      render: (challan) => (
        <span className="text-[11px] text-gray-500">
          {pluralise(challan.items.length, 'line')}
          <span className="block text-gray-400">{formatNumber(challan.totalQuantity)} units</span>
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Value',
      align: 'right',
      render: (challan) => (
        <span className="text-xs font-bold">{formatCurrency(challan.totalAmount)}</span>
      ),
    },
    {
      key: 'raisedBy',
      header: 'Raised by',
      hideBelow: 'xl',
      render: (challan) => (
        <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <Avatar name={challan.createdBy.name} size="xs" tone="soft" />
          {challan.createdBy.name}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      render: (challan) => <ChallanStatusBadge status={challan.status} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Sales challans"
        subtitle="Draft, confirm and dispatch consignments. Confirming reduces stock."
        actions={
          can('challan:write') ? (
            <ButtonLink to="/challans/new" variant="accent" icon={<Plus className="h-3.5 w-3.5" />}>
              New challan
            </ButtonLink>
          ) : null
        }
      />

      {summary.data ? (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="p-3">
            <p className="text-[10px] font-medium text-gray-400">Total challans</p>
            <p className="text-xl font-bold">{formatNumber(summary.data.totalChallans)}</p>
          </Card>
          <Card className="p-3">
            <p className="text-[10px] font-medium text-gray-400">Drafts open</p>
            <p className="text-xl font-bold">{formatNumber(summary.data.byStatus.DRAFT.count)}</p>
          </Card>
          <Card className="p-3">
            <p className="text-[10px] font-medium text-gray-400">Confirmed</p>
            <p className="text-xl font-bold text-emerald-600">
              {formatNumber(summary.data.byStatus.CONFIRMED.count)}
            </p>
          </Card>
          <Card className="p-3">
            <p className="text-[10px] font-medium text-gray-400">Dispatched value</p>
            <p className="text-xl font-bold">{formatCurrency(summary.data.confirmedValue)}</p>
          </Card>
        </section>
      ) : null}

      <FilterBar
        searchValue={values.search}
        onSearchChange={(search) => setValues({ search })}
        searchPlaceholder="Search challan number or customer"
        onClear={reset}
        hasFilters={hasFilters}
      >
        <FilterSelect
          value={values.status}
          onChange={(event) => setValues({ status: event.target.value })}
          options={CHALLAN_STATUS_OPTIONS}
          placeholder="All statuses"
          aria-label="Filter by status"
          className="w-36"
        />
        <FilterSelect
          value={values.customerId}
          onChange={(event) => setValues({ customerId: event.target.value })}
          options={(customers.data ?? []).map((customer) => ({
            value: customer.id,
            label: customer.businessName,
          }))}
          placeholder="All customers"
          aria-label="Filter by customer"
          className="w-48"
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
              rowKey={(challan) => challan.id}
              isLoading={isLoading}
              onRowClick={(challan) => navigate(`/challans/${challan.id}`)}
              emptyTitle={hasFilters ? 'No challans match these filters' : 'No challans yet'}
              emptyDescription={
                hasFilters
                  ? 'Try a different search term or clear the filters.'
                  : 'Raise a challan to dispatch stock to a customer.'
              }
              emptyAction={
                can('challan:write') && !hasFilters ? (
                  <ButtonLink to="/challans/new" variant="accent" icon={<Receipt className="h-3.5 w-3.5" />}>
                    New challan
                  </ButtonLink>
                ) : null
              }
              renderCard={(challan) => (
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <CellStack
                      title={challan.challanNumber}
                      subtitle={challan.customer.businessName}
                    />
                    <ChallanStatusBadge status={challan.status} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>
                      {pluralise(challan.items.length, 'line')} ·{' '}
                      {formatNumber(challan.totalQuantity)} units
                    </span>
                    <span className="font-bold text-gray-800">
                      {formatCurrency(challan.totalAmount)}
                    </span>
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
