import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import { api, ApiRequestError } from '../../lib/api';
import { toDateInputValue } from '../../lib/format';
import { CUSTOMER_STATUS_OPTIONS, CUSTOMER_TYPE_OPTIONS } from '../../lib/labels';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useToast } from '../../hooks/useToast';
import type { Customer, CustomerDetail } from '../../types/api';
import { Button } from '../../components/ui/Button';
import { SelectInput, TextArea, TextInput } from '../../components/ui/Form';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Surface';
import { ErrorState, InlineError, LoadingBlock } from '../../components/ui/States';

interface CustomerFormState {
  name: string;
  businessName: string;
  mobile: string;
  email: string;
  gstNumber: string;
  type: string;
  status: string;
  address: string;
  followUpDate: string;
  notes: string;
}

const EMPTY_FORM: CustomerFormState = {
  name: '',
  businessName: '',
  mobile: '',
  email: '',
  gstNumber: '',
  type: 'RETAIL',
  status: 'LEAD',
  address: '',
  followUpDate: '',
  notes: '',
};

/** Serves both `/customers/new` and `/customers/:id/edit`. */
export function CustomerFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const existing = useApiQuery<CustomerDetail>(isEdit ? `/customers/${id}` : null);

  const [form, setForm] = useState<CustomerFormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!existing.data) return;

    const customer = existing.data;
    setForm({
      name: customer.name,
      businessName: customer.businessName,
      mobile: customer.mobile,
      email: customer.email,
      gstNumber: customer.gstNumber ?? '',
      type: customer.type,
      status: customer.status,
      address: customer.address,
      followUpDate: toDateInputValue(customer.followUpDate),
      notes: customer.notes ?? '',
    });
  }, [existing.data]);

  const update = (patch: Partial<CustomerFormState>) => setForm((current) => ({ ...current, ...patch }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setIsSaving(true);

    const payload = {
      name: form.name,
      businessName: form.businessName,
      mobile: form.mobile,
      email: form.email,
      gstNumber: form.gstNumber || null,
      type: form.type,
      status: form.status,
      address: form.address,
      followUpDate: form.followUpDate || null,
      notes: form.notes || null,
    };

    try {
      const { data } = isEdit
        ? await api.patch<Customer>(`/customers/${id}`, payload)
        : await api.post<Customer>('/customers', payload);

      toast.success(isEdit ? 'Customer updated' : `${data.businessName} added`);
      navigate(`/customers/${data.id}`);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setFieldErrors(error.fieldMessages);
        // Conflicts and other business errors have no field to attach to.
        if (error.fieldErrors.length === 0) setFormError(error.message);
        else toast.error('Please correct the highlighted fields');
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isEdit && existing.isLoading) {
    return <LoadingBlock label="Loading customer" />;
  }

  if (isEdit && existing.error) {
    return <ErrorState message={existing.error.message} onRetry={existing.refetch} />;
  }

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit customer' : 'Add customer'}
        subtitle={
          isEdit
            ? 'Update the account details. Changes apply to future documents only.'
            : 'Register a lead or an active buying account.'
        }
        backTo={isEdit ? `/customers/${id}` : '/customers'}
        backLabel={isEdit ? 'Back to customer' : 'Back to customers'}
      />

      <Panel>
        <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
          {formError ? <InlineError message={formError} /> : null}

          <section className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Contact name"
              value={form.name}
              onChange={(event) => update({ name: event.target.value })}
              error={fieldErrors.name}
              placeholder="Suresh Iyer"
              required
            />
            <TextInput
              label="Business name"
              value={form.businessName}
              onChange={(event) => update({ businessName: event.target.value })}
              error={fieldErrors.businessName}
              placeholder="Shree Traders"
              required
            />
            <TextInput
              label="Mobile number"
              value={form.mobile}
              onChange={(event) => update({ mobile: event.target.value })}
              error={fieldErrors.mobile}
              placeholder="9820011223"
              inputMode="tel"
              hint="10 digit Indian mobile number"
              required
            />
            <TextInput
              label="Email"
              type="email"
              value={form.email}
              onChange={(event) => update({ email: event.target.value })}
              error={fieldErrors.email}
              placeholder="suresh@shreetraders.in"
              required
            />
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <SelectInput
              label="Customer type"
              value={form.type}
              onChange={(event) => update({ type: event.target.value })}
              options={CUSTOMER_TYPE_OPTIONS}
              error={fieldErrors.type}
              required
            />
            <SelectInput
              label="Status"
              value={form.status}
              onChange={(event) => update({ status: event.target.value })}
              options={CUSTOMER_STATUS_OPTIONS}
              error={fieldErrors.status}
              required
            />
            <TextInput
              label="GST number"
              value={form.gstNumber}
              onChange={(event) => update({ gstNumber: event.target.value })}
              error={fieldErrors.gstNumber}
              placeholder="27AAECS1234F1Z5"
              hint="Optional — 15 character GSTIN"
            />
          </section>

          <TextArea
            label="Address"
            value={form.address}
            onChange={(event) => update({ address: event.target.value })}
            error={fieldErrors.address}
            placeholder="14 Kalbadevi Road, Mumbai, Maharashtra 400002"
            required
          />

          <section className="grid gap-4 sm:grid-cols-3">
            <TextInput
              label="Next follow-up"
              type="date"
              value={form.followUpDate}
              onChange={(event) => update({ followUpDate: event.target.value })}
              error={fieldErrors.followUpDate}
            />
            <TextArea
              label="Notes"
              className="sm:col-span-2"
              value={form.notes}
              onChange={(event) => update({ notes: event.target.value })}
              error={fieldErrors.notes}
              placeholder="Payment terms, delivery preferences, anything the desk should know."
            />
          </section>

          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200/70 pt-4">
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate(isEdit ? `/customers/${id}` : '/customers')}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="accent"
              size="md"
              isLoading={isSaving}
              icon={<Save className="h-4 w-4" />}
            >
              {isEdit ? 'Save changes' : 'Create customer'}
            </Button>
          </div>
        </form>
      </Panel>
    </>
  );
}
