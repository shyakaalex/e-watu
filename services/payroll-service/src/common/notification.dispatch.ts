const SUBJECTS: Record<string, string> = {
  'payroll-approval-needed': 'Payroll approval required',
  'payroll-locked': 'Payroll run locked',
  'payslip-emailed': 'Your payslip is ready',
  'leave-submitted': 'A leave request requires your approval',
  'leave-approved': 'Leave request approved',
  'leave-rejected': 'Leave request rejected',
  'leave-info-requested': 'More information requested on your leave request',
  'permit-expiring': 'Work permit / visa expiring soon',
};

/** Builds the short, human-readable line shown in the in-app notification feed — the raw
 *  payload dump is fine as an email body, but unreadable in a compact notification list. */
function buildInAppMessage(type: string, payload: Record<string, unknown>): string {
  switch (type) {
    case 'leave-submitted':
      return `${payload.employeeName ?? 'An employee'} submitted a ${payload.leaveType ?? ''} leave request for your approval.`;
    case 'leave-approved':
      return `Your ${payload.leaveType ?? ''} leave request was approved.`;
    case 'leave-rejected':
      return `Your ${payload.leaveType ?? ''} leave request was rejected${payload.reason ? `: ${payload.reason}` : '.'}`;
    case 'leave-info-requested':
      return `More information was requested on your leave request${payload.note ? `: ${payload.note}` : '.'}`;
    case 'permit-expiring':
      return `A work permit / visa is expiring soon.`;
    case 'payroll-approval-needed':
      return `A payroll run is waiting on your approval.`;
    case 'payroll-locked':
      return `A payroll run has been locked.`;
    case 'payslip-emailed':
      return `Your payslip is ready.`;
    default:
      return SUBJECTS[type] ?? 'You have a new notification.';
  }
}

async function resolveUserIdByEmail(email: string | undefined): Promise<string | undefined> {
  if (!email) return undefined;
  const base = process.env.IDENTITY_SERVICE_URL?.replace(/\/$/, '');
  const key = process.env.INTERNAL_API_KEY;
  if (!base || !key) return undefined;
  try {
    const res = await fetch(`${base}/api/v1/internal/users/by-email?email=${encodeURIComponent(email)}`, {
      headers: { 'x-internal-key': key },
    });
    if (!res.ok) return undefined;
    const body = (await res.json()) as { data?: { id: string } | null };
    return body.data?.id;
  } catch {
    return undefined;
  }
}

/** Fire-and-forget notification dispatch to notification-service — both an email (when an
 *  address is available) and an in-app inbox entry (when the recipient's email resolves to a
 *  known User account). */
export async function dispatchNotification(
  type: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const base = process.env.NOTIFICATION_SERVICE_URL?.replace(/\/$/, '');
  const key = process.env.INTERNAL_API_KEY;
  if (!base || !key) return;

  const to =
    typeof payload.employeeEmail === 'string'
      ? payload.employeeEmail
      : typeof payload.email === 'string'
        ? payload.email
        : undefined;
  const subject = SUBJECTS[type] ?? 'E-Watu notification';
  const detail = JSON.stringify({ type, ...payload }, null, 2);
  const userId = await resolveUserIdByEmail(to);

  try {
    await fetch(`${base}/api/v1/internal/dispatch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': key,
      },
      body: JSON.stringify({
        channel: to && userId ? 'both' : to ? 'email' : userId ? 'in_app' : 'email',
        to,
        userId,
        tenantId: payload.tenantId,
        title: subject,
        body: buildInAppMessage(type, payload),
        template: 'generic',
        payload: {
          subject,
          text: detail,
          html: `<p>${subject}</p><pre>${detail}</pre>`,
          notificationType: type,
          ...payload,
        },
      }),
    });
  } catch (err) {
    console.error('[notification] dispatch failed', err);
  }
}
