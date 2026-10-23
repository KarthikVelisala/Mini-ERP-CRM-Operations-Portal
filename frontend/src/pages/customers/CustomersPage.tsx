import { useNavigate } from 'react-router-dom';
import { CalendarClock, Plus, Users } from 'lucide-react';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useAuth } from '../../hooks/useAuth';
import { useListParams } from '../../hooks/useListParams';
import { cn } from '../../lib/cn';
import { formatDate, formatRelativeDay, isOverdue, pluralise } from '../../lib/format';
import { CUSTOMER_STATUS_OPTIONS, CUSTOMER_TYPE_OPTIONS } from '../../lib/labels';
import type { Customer } from '../../types/api';
import { ButtonLink } from '../../components/ui/Button';
import { CustomerStatusBadge, CustomerTypeBadge } from '../../components/ui/Badge';
import { CellStack, DataTable, type Column } from '../../components/ui/DataTable';
import { FilterBar, TogglePill } from '../../components/ui/FilterBar';
import { FilterSelect } from '../../components/ui/Form';
import { PageHeader } from '../../components/ui/PageHeader';
import { Pagination } from '../../components/ui/Pagination';
import { Panel } from '../../components/ui/Surface';
import { ErrorState } from '../../components/ui/States';
import { Avatar } from '../../components/ui/Avatar';

const DEFAULTS = {
  page: '1',
  search: '',
  status: '',
  type: '',
  followUpDue: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export function CustomersPage() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const { values, setValues, reset, hasFilters } = useListParams(DEFAULTS);

  const { data, meta, isLoading, error, refetch } = useApiQuery<Customer[]>('/customers', {
    page: values.page,
    pageSize: 10,
    search: values.search || undefined,
    status: values.status || undefined,
    type: values.type || undefined,
    followUpDue: values.followUpDue || undefined,
    sortBy: values.sortBy,
    sortOrder: values.sortOrder,
  });

  const columns: Array<Column<Customer>> = [
    {
      key: 'customer',
      header: 'Customer',
      render: (customer) => (
        <div className="flex items-center gap-2">
          <Avatar name={customer.businessName} size="md" tone="soft" />
          <CellStack title={customer.businessName} subtitle={customer.name} />
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      hideBelow: 'lg',
      render: (customer) => <CellStack title={customer.mobile} subtitle={customer.email} />,
    },
    {
      key: 'type',
      header: 'Type',
      hideBelow: 'sm',
      render: (customer) => <CustomerTypeBadge type={customer.type} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (customer) => <CustomerStatusBadge status={customer.status} />,
    },
    {
      key: 'followUp',
      header: 'Follow-up',
      hideBelow: 'md',
      render: (customer) =>
        customer.followUpDate ? (
          <span
            className={cn(
              'text-[11px] font-semibold',
              isOverdue(customer.followUpDate) ? 'text-accent' : 'text-gray-600',
            )}
          >
            {formatRelativeDay(customer.followUpDate)}
            <span className="block font-normal text-gray-400">
              {formatDate(customer.followUpDate)}
            </span>
          </span>
        ) : (
          <span className="text-[11px] text-gray-300">Not scheduled</span>
        ),
    },
    {
      key: 'activity',
      header: 'Activity',
      align: 'right',
      hideBelow: 'xl',
      render: (customer) => (
        <span className="text-[11px] text-gray-500">
          {pluralise(customer._count?.challans ?? 0, 'challan')}
          <span className="block text-gray-400">
            {pluralise(customer._count?.followUps ?? 0, 'follow-up')}
          </span>
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="Leads, active accounts and the follow-ups that keep them moving."
        actions={
          can('customer:write') ? (
            <ButtonLink to="/customers/new" variant="accent" icon={<Plus className="h-3.5 w-3.5" />}>
              Add customer
            </ButtonLink>
          ) : null
        }
      />

      <FilterBar
        searchValue={values.search}
        onSearchChange={(search) => setValues({ search })}
        searchPlaceholder="Search name, business, mobile, email or GST"
        onClear={reset}
        hasFilters={hasFilters}
      >
        <FilterSelect
          value={values.status}
          onChange={(event) => setValues({ status: event.target.value })}
          options={CUSTOMER_STATUS_OPTIONS}
          placeholder="All statuses"
          aria-label="Filter by status"
          className="w-36"
        />
        <FilterSelect
          value={values.type}
          onChange={(event) => setValues({ type: event.target.value })}
          options={CUSTOMER_TYPE_OPTIONS}
          placeholder="All types"
          aria-label="Filter by customer type"
          className="w-36"
        />
        <TogglePill
          isActive={values.followUpDue === 'true'}
          onToggle={() => setValues({ followUpDue: values.followUpDue === 'true' ? '' : 'true' })}
        >
          <CalendarClock className="h-3 w-3" />
          Follow-up due
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
              rowKey={(customer) => customer.id}
              isLoading={isLoading}
              onRowClick={(customer) => navigate(`/customers/${customer.id}`)}
              emptyTitle={hasFilters ? 'No customers match these filters' : 'No customers yet'}
              emptyDescription={
                hasFilters
                  ? 'Try a different search term or clear the filters.'
                  : 'Add your first customer to start tracking leads and orders.'
              }
              emptyAction={
                can('customer:write') && !hasFilters ? (
                  <ButtonLink to="/customers/new" variant="accent" icon={<Users className="h-3.5 w-3.5" />}>
                    Add customer
                  </ButtonLink>
                ) : null
              }
              renderCard={(customer) => (
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar name={customer.businessName} size="md" tone="soft" />
                      <CellStack title={customer.businessName} subtitle={customer.name} />
                    </div>
                    <CustomerStatusBadge status={customer.status} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>{customer.mobile}</span>
                    <CustomerTypeBadge type={customer.type} />
                  </div>
                  {customer.followUpDate ? (
                    <span
                      className={cn(
                        'text-[11px] font-semibold',
                        isOverdue(customer.followUpDate) ? 'text-accent' : 'text-gray-500',
                      )}
                    >
                      Follow-up {formatRelativeDay(customer.followUpDate)}
                    </span>
                  ) : null}
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
