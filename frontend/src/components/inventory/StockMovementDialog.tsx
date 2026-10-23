import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiRequestError } from '../../lib/api';
import { formatNumber } from '../../lib/format';
import { useToast } from '../../hooks/useToast';
import type { MovementType, Product } from '../../types/api';
import { Button } from '../ui/Button';
import { SelectInput, TextArea, TextInput } from '../ui/Form';
import { Modal } from '../ui/Modal';
import { InlineError } from '../ui/States';

interface StockMovementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRecorded: () => void;
  /** Pre-selected product; when omitted the dialog offers a picker. */
  product?: Pick<Product, 'id' | 'name' | 'sku' | 'currentStock'>;
  products?: Array<Pick<Product, 'id' | 'name' | 'sku' | 'currentStock'>>;
}

const REASON_SUGGESTIONS: Record<MovementType, string[]> = {
  IN: ['Goods received from supplier', 'Customer return', 'Stock count correction'],
  OUT: ['Damaged in transit', 'Sample dispatch', 'Stock count correction'],
};

/**
 * Records a manual IN/OUT adjustment. The server rejects anything that would
 * push stock below zero, and that message is surfaced verbatim so the user sees
 * exactly what is available.
 */
export function StockMovementDialog({
  isOpen,
  onClose,
  onRecorded,
  product,
  products,
}: StockMovementDialogProps) {
  const toast = useToast();

  const [productId, setProductId] = useState(product?.id ?? '');
  const [type, setType] = useState<MovementType>('IN');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Reset whenever the dialog is reopened so stale input never leaks through.
  useEffect(() => {
    if (!isOpen) return;

    setProductId(product?.id ?? '');
    setType('IN');
    setQuantity('');
    setReason('');
    setFieldErrors({});
    setFormError(null);
  }, [isOpen, product?.id]);

  const selected = product ?? products?.find((entry) => entry.id === productId);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setIsSaving(true);

    try {
      await api.post('/inventory/movements', {
        productId,
        type,
        quantity: Number(quantity),
        reason,
      });

      toast.success(`Stock ${type === 'IN' ? 'added' : 'removed'} and logged`);
      onRecorded();
      onClose();
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setFieldErrors(error.fieldMessages);
        if (error.fieldErrors.length === 0) setFormError(error.message);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record stock movement"
      description="Every adjustment is written to the inventory ledger with the resulting balance."
      size="md"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {formError ? <InlineError message={formError} /> : null}

        {product ? (
          <div className="rounded-xl border border-gray-100 bg-white px-3 py-2">
            <p className="text-xs font-semibold text-gray-800">{product.name}</p>
            <p className="text-[11px] text-gray-500">
              {product.sku} · {formatNumber(product.currentStock)} units on hand
            </p>
          </div>
        ) : (
          <SelectInput
            label="Product"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            options={(products ?? []).map((entry) => ({
              value: entry.id,
              label: `${entry.name} (${entry.sku}) — ${entry.currentStock} on hand`,
            }))}
            placeholder="Select a product"
            error={fieldErrors.productId}
            required
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectInput
            label="Movement type"
            value={type}
            onChange={(event) => setType(event.target.value as MovementType)}
            options={[
              { value: 'IN', label: 'IN — stock received' },
              { value: 'OUT', label: 'OUT — stock removed' },
            ]}
            error={fieldErrors.type}
            required
          />
          <TextInput
            label="Quantity"
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            error={fieldErrors.quantity}
            placeholder="25"
            hint={
              selected && type === 'OUT'
                ? `At most ${formatNumber(selected.currentStock)} available`
                : undefined
            }
            required
          />
        </div>

        <TextArea
          label="Reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          error={fieldErrors.reason}
          placeholder={REASON_SUGGESTIONS[type][0]}
          rows={2}
          required
        />

        <div className="flex flex-wrap gap-1.5">
          {REASON_SUGGESTIONS[type].map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setReason(suggestion)}
              className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-medium text-gray-600 transition hover:bg-gray-50"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200/70 pt-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="accent" isLoading={isSaving}>
            Record movement
          </Button>
        </div>
      </form>
    </Modal>
  );
}
