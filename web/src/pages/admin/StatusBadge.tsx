export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase().replace(/_/g, '-');
  const cls =
    key === 'active'
      ? 'status-badge--active'
      : key === 'pending-approval' || key === 'pending'
        ? 'status-badge--pending'
        : key === 'rejected'
          ? 'status-badge--rejected'
          : 'status-badge--draft';

  return (
    <span className={`status-badge ${cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
