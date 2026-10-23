import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import { api, ApiRequestError } from '../../lib/api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useToast } from '../../hooks/useToast';
import type { Product, ProductDetail } from '../../types/api';
import { Button } from '../../components/ui/Button';
import { SelectInput, TextInput } from '../../components/ui/Form';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Surface';
import { ErrorState, InlineError, LoadingBlock } from '../../components/ui/States';

interface ProductFormState {
  name: string;
  sku: string;
  category: string;
  unitPrice: string;
  currentStock: string;
  minStockAlert: string;
  location: string;
  isActive: string;
}

const EMPTY_FORM: ProductFormState = {
  name: '',
  sku: '',
  category: '',
  unitPrice: '',
  currentStock: '0',
  minStockAlert: '0',
  location: '',
  isActive: 'true',
};

/**
 * Serves `/products/new` and `/products/:id/edit`.
 *
 * Opening stock can only be set at creation time — afterwards stock changes go
 * through a recorded movement, which is what keeps the ledger trustworthy.
 */
export function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const existing = useApiQuery<ProductDetail>(isEdit ? `/products/${id}` : null);
  const facets = useApiQuery<{ categories: string[]; locations: string[] }>('/products/facets');

  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!existing.data) return;

    const product = existing.data;
    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      unitPrice: String(product.unitPrice),
      currentStock: String(product.currentStock),
      minStockAlert: String(product.minStockAlert),
      location: product.location,
      isActive: String(product.isActive),
    });
  }, [existing.data]);

  const update = (patch: Partial<ProductFormState>) => setForm((current) => ({ ...current, ...patch }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setIsSaving(true);

    const shared = {
      name: form.name,
      sku: form.sku,
      category: form.category,
      unitPrice: Number(form.unitPrice),
      minStockAlert: Number(form.minStockAlert),
      location: form.location,
    };

    try {
      const { data } = isEdit
        ? await api.patch<Product>(`/products/${id}`, {
            ...shared,
            isActive: form.isActive === 'true',
          })
        : await api.post<Product>('/products', {
            ...shared,
            currentStock: Number(form.currentStock),
          });

      toast.success(isEdit ? 'Product updated' : `${data.name} added to the catalogue`);
      navigate(`/products/${data.id}`);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setFieldErrors(error.fieldMessages);
        if (error.fieldErrors.length === 0) setFormError(error.message);
        else toast.error('Please correct the highlighted fields');
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isEdit && existing.isLoading) return <LoadingBlock label="Loading product" />;
  if (isEdit && existing.error) {
    return <ErrorState message={existing.error.message} onRetry={existing.refetch} />;
  }

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit product' : 'Add product'}
        subtitle={
          isEdit
            ? 'Update catalogue details. Stock changes are made from the inventory screen.'
            : 'Add an item to the catalogue, optionally with its opening stock.'
        }
        backTo={isEdit ? `/products/${id}` : '/products'}
        backLabel={isEdit ? 'Back to product' : 'Back to products'}
      />

      <Panel>
        <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
          {formError ? <InlineError message={formError} /> : null}

          <section className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Product name"
              value={form.name}
              onChange={(event) => update({ name: event.target.value })}
              error={fieldErrors.name}
              placeholder="Basmati Rice 25kg Bag"
              required
            />
            <TextInput
              label="SKU / code"
              value={form.sku}
              onChange={(event) => update({ sku: event.target.value })}
              error={fieldErrors.sku}
              placeholder="GRN-RICE-25"
              hint="Letters, numbers and - _ / only. Stored in upper case."
              required
            />
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Category"
              value={form.category}
              onChange={(event) => update({ category: event.target.value })}
              error={fieldErrors.category}
              placeholder="Grains"
              list="product-categories"
              required
            />
            <TextInput
              label="Location / warehouse"
              value={form.location}
              onChange={(event) => update({ location: event.target.value })}
              error={fieldErrors.location}
              placeholder="Bhiwandi Warehouse A"
              list="product-locations"
              required
            />

            {/* Suggestions from what already exists, without forcing a fixed list */}
            <datalist id="product-categories">
              {(facets.data?.categories ?? []).map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
            <datalist id="product-locations">
              {(facets.data?.locations ?? []).map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <TextInput
              label="Unit price"
              type="number"
              min="0"
              step="0.01"
              leading="₹"
              value={form.unitPrice}
              onChange={(event) => update({ unitPrice: event.target.value })}
              error={fieldErrors.unitPrice}
              placeholder="2150.00"
              required
            />
            <TextInput
              label="Minimum stock alert"
              type="number"
              min="0"
              step="1"
              value={form.minStockAlert}
              onChange={(event) => update({ minStockAlert: event.target.value })}
              error={fieldErrors.minStockAlert}
              hint="Flag the product below this level"
              required
            />

            {isEdit ? (
              <SelectInput
                label="Catalogue status"
                value={form.isActive}
                onChange={(event) => update({ isActive: event.target.value })}
                options={[
                  { value: 'true', label: 'Active — can be sold' },
                  { value: 'false', label: 'Discontinued' },
                ]}
                error={fieldErrors.isActive}
                hint="Discontinued products cannot be added to a challan"
              />
            ) : (
              <TextInput
                label="Opening stock"
                type="number"
                min="0"
                step="1"
                value={form.currentStock}
                onChange={(event) => update({ currentStock: event.target.value })}
                error={fieldErrors.currentStock}
                hint="Recorded as an IN movement"
              />
            )}
          </section>

          {isEdit ? (
            <p className="rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-[11px] text-gray-500">
              Stock is currently{' '}
              <span className="font-semibold text-gray-700">{existing.data?.currentStock}</span> units.
              It can only be changed by recording a stock movement, so the inventory ledger always
              reconciles.
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200/70 pt-4">
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate(isEdit ? `/products/${id}` : '/products')}
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
              {isEdit ? 'Save changes' : 'Create product'}
            </Button>
          </div>
        </form>
      </Panel>
    </>
  );
}
