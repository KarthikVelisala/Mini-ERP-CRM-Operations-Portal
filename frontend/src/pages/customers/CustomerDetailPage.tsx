import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarClock, FileText, Mail, MapPin, MessageSquarePlus, Pencil, Phone, Receipt } from 'lucide-react';
import { api, ApiRequestError } from '../../lib/api';
import { cn } from '../../lib/cn';
import {
  formatCompactCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatRelativeDay,
  isOverdue,
} from '../../lib/format';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import type { CustomerDetail } from '../../types/api';
import { Avatar } from '../../components/ui/Avatar';
import { ChallanStatusBadge, CustomerStatusBadge, CustomerTypeBadge } from '../../components/ui/Badge';
import { Button, ButtonLink } from '../../components/ui/Button';
import { TextArea, TextInput } from '../../components/ui/Form';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, ListRow, Panel } from '../../components/ui/Surface';
import { EmptyState, ErrorState, InlineError, LoadingBlock } from '../../components/ui/States';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { can } = useAuth();
  const { data, isLoading, error, refetch } = useApiQuery<CustomerDetail>(`/customers/${id}`);

  if (isLoading) return <LoadingBlock label="Loading customer" />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!data) return null;

  return (
    <>
      <PageHeader
        title={data.businessName}
        backTo="/customers"
        backLabel="Back to customers"
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span>{data.name}</span>
            <CustomerStatusBadge status={data.status} />
            <CustomerTypeBadge type={data.type} />
            <span className="text-gray-400">Added {formatDate(data.createdAt)}</span>
          </span>
        }
        actions={
          <>
            {can('challan:write') ? (
              <ButtonLink
                to={`/challans/new?customerId=${data.id}`}
                variant="outline"
                icon={<Receipt className="h-3.5 w-3.5" />}
              >
                New challan
              </ButtonLink>
            ) : null}
            {can('customer:write') ? (
              <ButtonLink
                to={`/customers/${data.id}/edit`}
                variant="accent"
                icon={<Pencil className="h-3.5 w-3.5" />}
              >
                Edit
              </ButtonLink>
            ) : null}
          </>
        }
      />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Profile */}
        <Panel className="flex flex-col gap-4 lg:col-span-5">
          <div className="flex items-center gap-3">
            <Avatar name={data.businessName} size="lg" tone="accent" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{data.businessName}</p>
              <p className="truncate text-[11px] text-gray-500">{data.name}</p>
            </div>
          </div>

          <dl className="flex flex-col gap-2 text-xs">
            <DetailRow icon={<Phone className="h-3.5 w-3.5" />} label="Mobile" value={data.mobile} />
            <DetailRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={data.email} />
            <DetailRow
              icon={<FileText className="h-3.5 w-3.5" />}
              label="GST number"
              value={data.gstNumber ?? 'Not provided'}
            />
            <DetailRow
              icon={<MapPin className="h-3.5 w-3.5" />}
              label="Address"
              value={data.address}
            />
            <DetailRow
              icon={<CalendarClock className="h-3.5 w-3.5" />}
              label="Next follow-up"
              value={
                data.followUpDate ? (
                  <span
                    className={cn(
                      'font-semibold',
                      isOverdue(data.followUpDate) ? 'text-accent' : 'text-gray-700',
                    )}
                  >
                    {formatDate(data.followUpDate)} · {formatRelativeDay(data.followUpDate)}
                  </span>
                ) : (
                  'Not scheduled'
                )
              }
            />
          </dl>

          {data.notes ? (
            <div className="rounded-xl border border-gray-100 bg-white/80 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-xs text-gray-700">{data.notes}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <Card className="p-3 text-center">
              <p className="text-[10px] font-medium text-gray-400">Challans</p>
              <p className="text-lg font-bold">{data._count?.challans ?? 0}</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-[10px] font-medium text-gray-400">Follow-ups</p>
              <p className="text-lg font-bold">{data._count?.followUps ?? 0}</p>
            </Card>
          </div>
        </Panel>

        {/* Follow-ups */}
        <div className="flex flex-col gap-4 lg:col-span-7">
          <FollowUpPanel customerId={data.id} followUps={data.followUps} onAdded={refetch} />

          <Panel className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">Recent challans</span>
              {data.challans.length > 0 ? (
                <ButtonLink to={`/challans?customerId=${data.id}`} variant="outline" size="xs">
                  View all
                </ButtonLink>
              ) : null}
            </div>

            {data.challans.length === 0 ? (
              <EmptyState
                icon={<Receipt className="h-5 w-5" />}
                title="No challans raised yet"
                description="Sales challans created for this customer will appear here."
                className="py-6"
                action={
                  can('challan:write') ? (
                    <ButtonLink to={`/challans/new?customerId=${data.id}`} variant="accent">
                      Create challan
                    </ButtonLink>
                  ) : null
                }
              />
            ) : (
              <div className="space-y-2">
                {data.challans.map((challan) => (
                  <ListRow key={challan.id}>
                    <Link to={`/challans/${challan.id}`} className="min-w-0">
                      <span className="block truncate text-xs font-semibold">
                        {challan.challanNumber}
                      </span>
                      <span className="block truncate text-[10px] text-gray-400">
                        {formatDate(challan.createdAt)} · {formatNumber(challan.totalQuantity)} units
                      </span>
                    </Link>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs font-bold">
                        {formatCompactCurrency(challan.totalAmount)}
                      </span>
                      <ChallanStatusBadge status={challan.status} />
                    </div>
                  </ListRow>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </section>
    </>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-gray-100 bg-white/80 px-3 py-2">
      <span className="mt-0.5 text-gray-400">{icon}</span>
      <div className="min-w-0 flex-1">
        <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</dt>
        <dd className="break-words text-xs text-gray-700">{value}</dd>
      </div>
    </div>
  );
}

function FollowUpPanel({
  customerId,
  followUps,
  onAdded,
}: {
  customerId: string;
  followUps: CustomerDetail['followUps'];
  onAdded: () => void;
}) {
  const { can } = useAuth();
  const toast = useToast();

  const [note, setNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setIsSaving(true);

    try {
      await api.post(`/customers/${customerId}/follow-ups`, {
        note,
        followUpDate: followUpDate || null,
      });

      setNote('');
      setFollowUpDate('');
      toast.success('Follow-up logged');
      onAdded();
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
    <Panel className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">Follow-ups</span>
        <span className="text-[11px] text-gray-400">{followUps.length} logged</span>
      </div>

      {can('followup:write') ? (
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white/80 p-3"
          noValidate
        >
          {formError ? <InlineError message={formError} /> : null}

          <TextArea
            label="Add a follow-up note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            error={fieldErrors.note}
            placeholder="Called about the pending consignment — customer will confirm quantities tomorrow."
            rows={2}
            required
          />

          <div className="flex flex-wrap items-end gap-3">
            <TextInput
              label="Next follow-up date"
              type="date"
              className="w-44"
              value={followUpDate}
              onChange={(event) => setFollowUpDate(event.target.value)}
              error={fieldErrors.followUpDate}
              hint="Optional — updates the customer"
            />
            <Button
              type="submit"
              variant="accent"
              className="mb-5"
              isLoading={isSaving}
              icon={<MessageSquarePlus className="h-3.5 w-3.5" />}
            >
              Log follow-up
            </Button>
          </div>
        </form>
      ) : null}

      {followUps.length === 0 ? (
        <EmptyState
          icon={<MessageSquarePlus className="h-5 w-5" />}
          title="No follow-ups yet"
          description="Log a note after every call or visit to keep the account history complete."
          className="py-6"
        />
      ) : (
        <ol className="flex flex-col gap-2">
          {followUps.map((followUp) => (
            <li
              key={followUp.id}
              className="rounded-xl border border-gray-100 bg-white/80 p-3"
            >
              <p className="whitespace-pre-wrap text-xs text-gray-700">{followUp.note}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-gray-400">
                <span className="flex items-center gap-1">
                  <Avatar name={followUp.createdBy.name} size="xs" tone="soft" />
                  {followUp.createdBy.name}
                </span>
                <span>·</span>
                <span>{formatDateTime(followUp.createdAt)}</span>
                {followUp.followUpDate ? (
                  <>
                    <span>·</span>
                    <span className="font-semibold text-accent">
                      next {formatDate(followUp.followUpDate)}
                    </span>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
