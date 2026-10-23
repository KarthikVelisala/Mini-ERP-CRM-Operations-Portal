import { Compass } from 'lucide-react';
import { ButtonLink } from '../components/ui/Button';
import { EmptyState } from '../components/ui/States';
import { PageHeader } from '../components/ui/PageHeader';

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page not found" />
      <EmptyState
        icon={<Compass className="h-5 w-5" />}
        title="That screen does not exist"
        description="The link may be out of date, or the record was removed."
        action={<ButtonLink to="/">Back to overview</ButtonLink>}
      />
    </>
  );
}
