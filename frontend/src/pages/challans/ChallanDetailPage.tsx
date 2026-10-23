import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Ban, CheckCircle2, Pencil, Printer } from 'lucide-react';
import { api, ApiRequestError } from '../../lib/api';
import { cn } from '../../lib/cn';
import { formatCurrency, formatDate, formatDateTime, formatNumber, pluralise } from '../../lib/format';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import type { ChallanDetail } from '../../types/api';
import { Avatar } from '../../components/ui/Avatar';
import { ChallanStatusBadge, CustomerTypeBadge, MovementBadge } from '../../components/ui/Badge';
import { Button, ButtonLink } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/Form';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, Panel } from '../../components/ui/Surface';
import { ErrorState, InlineError, LoadingBlock } from '../../components/ui/States';
import { ChallanInvoicePDF } from '../../components/challans/ChallanInvoicePDF';
import { generateChallanPdfFromElement } from '../../utils/pdf';

export function ChallanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { can } = useAuth();
  const toast = useToast();

  const { data, isLoading, error, refetch } = useApiQuery<ChallanDetail>(`/challans/${id}`);

  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handlePrintPdf = async () => {
    if (!pdfContainerRef.current || !data) return;
    setIsGeneratingPdf(true);
    try {
      const filename = `Invoice_${data.challanNumber}.pdf`;
      await generateChallanPdfFromElement(pdfContainerRef.current, filename);
      toast.success(`PDF generated: ${filename}`);
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF invoice.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (isLoading) return <LoadingBlock label="Loading challan" />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!data) return null;

  const confirm = async () => {
    setConfirmError(null);
    setIsConfirming(true);

    try {
      await api.post(`/challans/${data.id}/confirm`);
      toast.success(`${data.challanNumber} confirmed — stock released`);
      refetch();
    } catch (caught) {
      const message =
        caught instanceof ApiRequestError ? caught.message : 'Something went wrong. Please try again.';
      setConfirmError(message);
      toast.error(message);
    } finally {
      setIsConfirming(false);
    }
  };

  const cancel = async () => {
    setIsCancelling(true);

    try {
      await api.post(`/challans/${data.id}/cancel`, { reason: cancelReason || null });
      toast.success(
        data.status === 'CONFIRMED'
          ? `${data.challanNumber} cancelled — stock returned`
          : `${data.challanNumber} cancelled`,
      );
      setIsCancelOpen(false);
      setCancelReason('');
      refetch();
    } catch (caught) {
      toast.error(
        caught instanceof ApiRequestError ? caught.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const isDraft = data.status === 'DRAFT';

  return (
    <>
      <PageHeader
        title={data.challanNumber}
        backTo="/challans"
        backLabel="Back to challans"
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <ChallanStatusBadge status={data.status} />
            <span>Raised {formatDateTime(data.createdAt)}</span>
            <span className="text-gray-400">by {data.createdBy.name}</span>
          </span>
        }
        actions={
          <>
            <Button
              variant="outline"
              icon={<Printer className="h-3.5 w-3.5" />}
              isLoading={isGeneratingPdf}
              onClick={handlePrintPdf}
            >
              Print / Export PDF
            </Button>

            {isDraft && can('challan:write') ? (
              <ButtonLink
                to={`/challans/${data.id}/edit`}
                variant="outline"
                icon={<Pencil className="h-3.5 w-3.5" />}
              >
                Edit
              </ButtonLink>
            ) : null}

            {data.status !== 'CANCELLED' && can('challan:cancel') ? (
              <Button
                variant="danger"
                icon={<Ban className="h-3.5 w-3.5" />}
                onClick={() => setIsCancelOpen(true)}
              >
                Cancel
              </Button>
            ) : null}

            {isDraft && can('challan:confirm') ? (
              <Button
                variant="accent"
                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                isLoading={isConfirming}
                onClick={confirm}
              >
                Confirm &amp; release stock
              </Button>
            ) : null}
          </>
        }
      />

      {confirmError ? <InlineError message={confirmError} /> : null}

      {isDraft ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800">
          This challan is a draft. Stock has not been reduced yet — confirming will release{' '}
          {formatNumber(data.totalQuantity)} units from the warehouse.
        </p>
      ) : null}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-3">
          <p className="text-[10px] font-medium text-gray-400">Line items</p>
          <p className="text-xl font-bold">{formatNumber(data.items.length)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] font-medium text-gray-400">Total quantity</p>
          <p className="text-xl font-bold">{formatNumber(data.totalQuantity)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] font-medium text-gray-400">Total value</p>
          <p className="text-xl font-bold">{formatCurrency(data.totalAmount)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] font-medium text-gray-400">
            {data.status === 'CANCELLED' ? 'Cancelled' : 'Confirmed'}
          </p>
          <p className="text-xs font-semibold text-gray-700">
            {data.status === 'CANCELLED'
              ? formatDate(data.cancelledAt)
              : data.confirmedAt
                ? formatDate(data.confirmedAt)
                : 'Not yet'}
          </p>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Panel className="flex flex-col gap-3 lg:col-span-4">
          <span className="text-xs font-semibold text-gray-700">Deliver to</span>

          <div className="rounded-xl border border-gray-100 bg-white/80 p-3">
            <div className="flex items-center gap-2">
              <Avatar name={data.customer.businessName} size="lg" tone="accent" />
              <div className="min-w-0">
                <Link
                  to={`/customers/${data.customer.id}`}
                  className="block truncate text-sm font-semibold hover:text-accent"
                >
                  {data.customer.businessName}
                </Link>
                <p className="truncate text-[11px] text-gray-500">{data.customer.name}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-1 text-[11px] text-gray-600">
              <span>{data.customer.mobile}</span>
              <span className="break-words">{data.customer.email}</span>
              <span className="break-words text-gray-500">{data.customer.address}</span>
              {data.customer.gstNumber ? (
                <span className="text-gray-400">GST {data.customer.gstNumber}</span>
              ) : null}
            </div>

            <div className="mt-3">
              <CustomerTypeBadge type={data.customer.type} />
            </div>
          </div>

          {data.notes ? (
            <div className="rounded-xl border border-gray-100 bg-white/80 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-xs text-gray-700">{data.notes}</p>
            </div>
          ) : null}
        </Panel>

        <div className="flex flex-col gap-4 lg:col-span-8">
          <Panel className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">Items dispatched</span>
              <span className="text-[11px] text-gray-400">
                Prices snapshotted when the challan was raised
              </span>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[520px] border-collapse">
                <thead>
                  <tr className="border-b border-gray-200/70 text-[11px] font-semibold text-gray-500">
                    <th scope="col" className="px-3 pb-2 text-left">Product</th>
                    <th scope="col" className="px-3 pb-2 text-left">Location</th>
                    <th scope="col" className="px-3 pb-2 text-right">Unit price</th>
                    <th scope="col" className="px-3 pb-2 text-right">Qty</th>
                    <th scope="col" className="px-3 pb-2 text-right">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100/80 last:border-0">
                      <td className="px-3 py-3">
                        <div className="min-w-0">
                          {item.productId ? (
                            <Link
                              to={`/products/${item.productId}`}
                              className="truncate text-xs font-semibold text-gray-800 hover:text-accent"
                            >
                              {item.productName}
                            </Link>
                          ) : (
                            <span className="truncate text-xs font-semibold text-gray-800">
                              {item.productName}
                            </span>
                          )}
                          <span className="block truncate text-[11px] text-gray-400">
                            {item.productSku} · {item.productCategory}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[11px] text-gray-500">{item.productLocation}</td>
                      <td className="px-3 py-3 text-right text-xs">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-3 py-3 text-right text-xs font-semibold">
                        {formatNumber(item.quantity)}
                      </td>
                      <td className="px-3 py-3 text-right text-xs font-bold">
                        {formatCurrency(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200/70">
                    <td colSpan={3} className="px-3 pt-3 text-[11px] text-gray-400">
                      {pluralise(data.items.length, 'line')}
                    </td>
                    <td className="px-3 pt-3 text-right text-xs font-bold">
                      {formatNumber(data.totalQuantity)}
                    </td>
                    <td className="px-3 pt-3 text-right text-sm font-bold">
                      {formatCurrency(data.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Panel>

          <Panel className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-gray-700">Stock movements from this challan</span>

            {data.stockMovements.length === 0 ? (
              <p className="rounded-xl border border-dashed border-gray-200 bg-white/50 px-3 py-4 text-center text-[11px] text-gray-500">
                No stock has moved yet. Confirming the challan will release the quantities above.
              </p>
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
                          {movement.product.name}
                        </p>
                        <p className="truncate text-[10px] text-gray-400">
                          {movement.product.sku} · {formatDateTime(movement.createdAt)}
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
        </div>
      </section>

      <Modal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        title={`Cancel ${data.challanNumber}?`}
        description={
          data.status === 'CONFIRMED'
            ? 'The dispatched quantities will be returned to stock as IN movements.'
            : 'This draft will be marked as cancelled. No stock is affected.'
        }
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsCancelOpen(false)} disabled={isCancelling}>
              Keep challan
            </Button>
            <Button variant="accent" onClick={cancel} isLoading={isCancelling}>
              Cancel challan
            </Button>
          </>
        }
      >
        <TextInput
          label="Reason"
          value={cancelReason}
          onChange={(event) => setCancelReason(event.target.value)}
          placeholder="Customer postponed the delivery window"
          hint="Optional — recorded against the returned stock movements"
        />
      </Modal>

      {/* Isolated PDF template container rendered off-screen */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', pointerEvents: 'none' }}>
        <ChallanInvoicePDF ref={pdfContainerRef} data={data} />
      </div>
    </>
  );
}
