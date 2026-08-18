export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase().replace(/_/g, '-');
  const cls =
    key === 'active'
      ? 'status-badge--active'
      : key === 'pending-approval' || key === 'pending' || key === 'pending-activation'
        ? 'status-badge--pending'
        : key === 'rejected'
          ? 'status-badge--rejected'
          : key === 'suspended'
            ? 'status-badge--suspended'
            : key === 'trial'
              ? 'status-badge--trial'
              : key === 'expired'
                ? 'status-badge--expired'
                : 'status-badge--draft';

  return (
    <span className={`status-badge ${cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
