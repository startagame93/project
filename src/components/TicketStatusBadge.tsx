import type { TicketStatus } from '@/lib/supabase';

export const TICKET_STATUSES: TicketStatus[] = ['open', 'in_progress', 'closed'];

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  open: 'Aperto',
  in_progress: 'In lavorazione',
  closed: 'Risolto',
};

const BADGE_CLASS: Record<TicketStatus, string> = {
  open: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
  in_progress: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
  closed: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${BADGE_CLASS[status]}`}>
      {TICKET_STATUS_LABEL[status]}
    </span>
  );
}
