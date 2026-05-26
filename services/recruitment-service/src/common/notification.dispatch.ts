const SUBJECTS: Record<string, string> = {
  'application-received': 'Application received',
  'interview-scheduled': 'Interview scheduled',
  'offer-sent': 'Job offer sent',
  'placement-created': 'Placement created',
};

/** Fire-and-forget notification dispatch to notification-service. */
export async function dispatchNotification(
  type: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const base = process.env.NOTIFICATION_SERVICE_URL?.replace(/\/$/, '');
  const key = process.env.INTERNAL_API_KEY;
  if (!base || !key) return;

  const to =
    typeof payload.candidateEmail === 'string' ? payload.candidateEmail : undefined;
  const subject = SUBJECTS[type] ?? 'E-Watu notification';
  const body = JSON.stringify({ type, ...payload }, null, 2);

  try {
    await fetch(`${base}/api/v1/internal/dispatch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': key,
      },
      body: JSON.stringify({
        channel: to ? 'email' : 'in_app',
        to,
        tenantId: payload.tenantId,
        template: 'generic',
        payload: {
          subject,
          text: body,
          html: `<p>${subject}</p><pre>${body}</pre>`,
          notificationType: type,
          ...payload,
        },
      }),
    });
  } catch (err) {
    console.error('[notification] dispatch failed', err);
  }
}
