import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Plus, Save, Trash2 } from 'lucide-react';
import { api, ApiRequestError } from '../../lib/api';
import { cn } from '../../lib/cn';
import { formatCurrency, formatNumber } from '../../lib/format';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import type { Challan, ChallanDetail, Customer, Product } from '../../types/api';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { SelectInput, TextArea, TextInput } from '../../components/ui/Form';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, Panel } from '../../components/ui/Surface';
import { EmptyState, ErrorState, InlineError, LoadingBlock } from '../../components/ui/States';

interface LineDraft {
  /** Stable key so React does not re-mount rows when the list changes. */
  key: string;
  productId: string;
  quantity: string;
}

let nextLineKey = 0;
const newLine = (productId = '', quantity = '1'): LineDraft => ({
  key: `line-${++nextLineKey}`,
  productId,
  quantity,
});

/**
 * Serves `/challans/new` and `/challans/:id/edit`.
 *
 * Availability is shown per line as a courtesy — the server is what actually
 * enforces it, and a rejected confirmation is surfaced verbatim.
 */
export function ChallanFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = useAuth();
  const [searchParams] = useSearchParams();

  const existing = useApiQuery<ChallanDetail>(isEdit ? `/challans/${id}` : null);
  const customers = useApiQuery<Customer[]>('/customers', {
    pageSize: 100,
    sortBy: 'name',
    sortOrder: 'asc',
  });
  // 100 is the API's maximum page size; ample for the catalogue at this scale.
  const products = useApiQuery<Product[]>('/products', {
    pageSize: 100,
    isActive: 'true',
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const [customerId, setCustomerId] = useState(searchParams.get('customerId') ?? '');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineDraft[]>([newLine()]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [savingAs, setSavingAs] = useState<'DRAFT' | 'CONFIRMED' | null>(null);

  useEffect(() => {
    if (!existing.data) return;

    setCustomerId(existing.data.customer.id);
    setNotes(existing.data.notes ?? '');
    setLines(
      existing.data.items.map((item) => newLine(item.productId ?? '', String(item.quantity))),
    );
  }, [existing.data]);

  const productsById = useMemo(
    () => new Map((products.data ?? []).map((product) => [product.id, product])),
    [products.data],
  );

  const selectedCustomer = (customers.data ?? []).find((customer) => customer.id === customerId);

  const rows = lines.map((line) => {
    const product = productsById.get(line.productId);
    const quantity = Number(line.quantity);
    const isValidQuantity = Number.isInteger(quantity) && quantity > 0;

    return {
      ...line,
      product,
      quantity,
      isValidQuantity,
      lineTotal: product && isValidQuantity ? product.unitPrice * quantity : 0,
      exceedsStock: Boolean(product && isValidQuantity && quantity > product.currentStock),
    };
  });

  // Only completed lines count towards the totals shown to the user.
  const totals = rows.reduce(
    (accumulator, row) => ({
      quantity: accumulator.quantity + (row.product && row.isValidQuantity ? row.quantity : 0),
      amount: accumulator.amount + row.lineTotal,
    }),
    { quantity: 0, amount: 0 },
  );

  const hasStockWarning = rows.some((row) => row.exceedsStock);
  const isComplete =
    Boolean(customerId) && rows.length > 0 && rows.every((row) => row.product && row.isValidQuantity);

  const updateLine = (key: string, patch: Partial<LineDraft>) =>
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));

  const removeLine = (key: string) =>
    setLines((current) => (current.length === 1 ? current : current.filter((line) => line.key !== key)));

  const submit = async (status: 'DRAFT' | 'CONFIRMED') => {
    setFieldErrors({});
    setFormError(null);
    setSavingAs(status);

    const payload = {
      customerId,
      notes: notes || null,
      items: rows.map((row) => ({ productId: row.productId, quantity: row.quantity })),
    };

    try {
      if (isEdit) {
        await api.patch<Challan>(`/challans/${id}`, payload);

        if (status === 'CONFIRMED') {
          await api.post<Challan>(`/challans/${id}/confirm`);
        }

        toast.success(status === 'CONFIRMED' ? 'Challan confirmed and stock released' : 'Draft saved');
        navigate(`/challans/${id}`);
        return;
      }

      const { data } = await api.post<Challan>('/challans', { ...payload, status });

      toast.success(
        status === 'CONFIRMED'
          ? `${data.challanNumber} confirmed and stock released`
          : `${data.challanNumber} saved as a draft`,
      );
      navigate(`/challans/${data.id}`);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setFieldErrors(error.fieldMessages);
        if (error.fieldErrors.length === 0) setFormError(error.message);
        toast.error(error.message);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setSavingAs(null);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit('DRAFT');
  };

  if (isEdit && existing.isLoading) return <LoadingBlock label="Loading challan" />;
  if (isEdit && existing.error) {
    return <ErrorState message={existing.error.message} onRetry={existing.refetch} />;
  }

  if (isEdit && existing.data && existing.data.status !== 'DRAFT') {
    return (
      <>
        <PageHeader title={existing.data.challanNumber} backTo={`/challans/${id}`} backLabel="Back" />
        <ErrorState
          title="This challan can no longer be edited"
          message={`Challan ${existing.data.challanNumber} is ${existing.data.status.toLowerCase()}. Confirmed and cancelled documents are immutable so the dispatch record stays accurate.`}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={isEdit ? `Edit ${existing.data?.challanNumber ?? 'challan'}` : 'New sales challan'}
        subtitle="Pick the customer, add the products and save as a draft or confirm to release stock."
        backTo={isEdit ? `/challans/${id}` : '/challans'}
        backLabel={isEdit ? 'Back to challan' : 'Back to challans'}
      />

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {formError ? <InlineError message={formError} /> : null}

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <Panel className="flex flex-col gap-4 lg:col-span-4">
            <span className="text-xs font-semibold text-gray-700">Customer</span>

            <SelectInput
              label="Select customer"
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
              options={(customers.data ?? []).map((customer) => ({
                value: customer.id,
                label: `${customer.businessName} — ${customer.name}`,
              }))}
              placeholder="Choose a customer"
              error={fieldErrors.customerId}
              required
            />

            {selectedCustomer ? (
              <div className="rounded-xl border border-gray-100 bg-white/80 p-3">
                <div className="flex items-center gap-2">
                  <Avatar name={selectedCustomer.businessName} size="md" tone="accent" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{selectedCustomer.businessName}</p>
                    <p className="truncate text-[11px] text-gray-500">{selectedCustomer.mobile}</p>
                  </div>
                </div>
                <p className="mt-2 break-words text-[11px] text-gray-500">{selectedCustomer.address}</p>
                {selectedCustomer.gstNumber ? (
                  <p className="mt-1 text-[11px] text-gray-400">GST {selectedCustomer.gstNumber}</p>
                ) : null}
              </div>
            ) : null}

            <TextArea
              label="Notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              error={fieldErrors.notes}
              placeholder="Transport details, delivery window, anything the warehouse should know."
              rows={3}
            />
          </Panel>

          <Panel className="flex flex-col gap-3 lg:col-span-8">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">Products</span>
              <Button
                variant="outline"
                size="xs"
                icon={<Plus className="h-3 w-3" />}
                onClick={() => setLines((current) => [...current, newLine()])}
              >
                Add line
              </Button>
            </div>

            {fieldErrors.items ? <InlineError message={fieldErrors.items} /> : null}

            {products.isLoading ? (
              <LoadingBlock label="Loading catalogue" />
            ) : (products.data ?? []).length === 0 ? (
              <EmptyState
                title="No products available"
                description="Add a product to the catalogue before raising a challan."
              />
            ) : (
              <div className="flex flex-col gap-2">
                {rows.map((row, index) => {
                  // Prevent the same product appearing on two lines.
                  const taken = new Set(
                    lines.filter((line) => line.key !== row.key).map((line) => line.productId),
                  );

                  return (
                    <div
                      key={row.key}
                      className={cn(
                        'rounded-xl border bg-white/80 p-3',
                        row.exceedsStock ? 'border-accent/40 bg-accent/5' : 'border-gray-100',
                      )}
                    >
                      <div className="flex flex-wrap items-end gap-3">
                        <SelectInput
                          label={`Product ${index + 1}`}
                          className="min-w-[12rem] flex-1"
                          value={row.productId}
                          onChange={(event) => updateLine(row.key, { productId: event.target.value })}
                          options={(products.data ?? [])
                            .filter((product) => !taken.has(product.id))
                            .map((product) => ({
                              value: product.id,
                              label: `${product.name} (${product.sku})`,
                            }))}
                          placeholder="Choose a product"
                          error={fieldErrors[`items.${index}.productId`]}
                          required
                        />

                        <TextInput
                          label="Quantity"
                          type="number"
                          min="1"
                          step="1"
                          className="w-28"
                          value={row.quantity}
                          onChange={(event) => updateLine(row.key, { quantity: event.target.value })}
                          error={fieldErrors[`items.${index}.quantity`]}
                          required
                        />

                        <div className="mb-1.5 w-28">
                          <p className="text-[10px] font-semibold text-gray-400">Line total</p>
                          <p className="text-sm font-bold">{formatCurrency(row.lineTotal)}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeLine(row.key)}
                          disabled={lines.length === 1}
                          aria-label={`Remove product ${index + 1}`}
                          className="mb-2 rounded-full p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {row.product ? (
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                          <span>{formatCurrency(row.product.unitPrice)} per unit</span>
                          <span>·</span>
                          <span>{row.product.location}</span>
                          <span>·</span>
                          <span
                            className={cn(
                              'font-semibold',
                              row.exceedsStock ? 'text-accent' : 'text-gray-600',
                            )}
                          >
                            {formatNumber(row.product.currentStock)} in stock
                          </span>
                          {row.exceedsStock ? (
                            <Badge tone="danger" icon={<AlertTriangle className="h-3 w-3" />}>
                              Exceeds available stock
                            </Badge>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}

            <Card className="mt-1 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-6">
                <div>
                  <p className="text-[10px] font-medium text-gray-400">Total quantity</p>
                  <p className="text-lg font-bold">{formatNumber(totals.quantity)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-gray-400">Total value</p>
                  <p className="text-lg font-bold">{formatCurrency(totals.amount)}</p>
                </div>
              </div>

              {hasStockWarning ? (
                <p className="flex items-center gap-1.5 text-[11px] font-medium text-accent">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  One or more lines exceed stock — you can still save a draft.
                </p>
              ) : null}
            </Card>
          </Panel>
        </section>

        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200/70 pt-4">
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate(isEdit ? `/challans/${id}` : '/challans')}
            disabled={savingAs !== null}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!isComplete}
            isLoading={savingAs === 'DRAFT'}
            icon={<Save className="h-4 w-4" />}
          >
            Save as draft
          </Button>
          {can('challan:confirm') ? (
            <Button
              variant="accent"
              size="md"
              disabled={!isComplete}
              isLoading={savingAs === 'CONFIRMED'}
              onClick={() => void submit('CONFIRMED')}
              icon={<CheckCircle2 className="h-4 w-4" />}
            >
              Confirm &amp; release stock
            </Button>
          ) : null}
        </div>
      </form>
    </>
  );
}
