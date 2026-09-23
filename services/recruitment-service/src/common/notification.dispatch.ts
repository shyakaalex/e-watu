const SUBJECTS: Record<string, string> = {
  'application-received': 'Application received',
  'interview-scheduled': 'Interview scheduled',
  'offer-sent': 'Job offer sent',
  'placement-created': 'Placement created',
};

// Fields already reflected elsewhere in the email (recipient address, internal ids) or not
// meaningful to a human reader — left out of the readable field list below.
const HIDDEN_FIELDS = new Set(['tenantId', 'candidateEmail', 'candidateId', 'jobId', 'applicationId']);

function humanizeKey(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function humanizeValue(value: unknown): string {
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toLocaleString();
  }
  return String(value);
}

/** Renders a notification payload as a clean, human-readable field list instead of a raw JSON
 *  dump — every dispatched type shares this, so no per-type email template is needed. */
function buildEmailBody(subject: string, payload: Record<string, unknown>): { text: string; html: string } {
  const rows = Object.entries(payload)
    .filter(([key, value]) => !HIDDEN_FIELDS.has(key) && value !== undefined && value !== null && value !== '')
    .map(([key, value]) => [humanizeKey(key), humanizeValue(value)] as const);

  const text = [subject, '', ...rows.map(([k, v]) => `${k}: ${v}`)].join('\n');
  const html =
    `<h2 style="margin:0 0 12px;font-family:sans-serif;font-size:18px;">${subject}</h2>` +
    `<table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;">` +
    rows
      .map(([k, v]) => {
        const isUrl = /^https?:\/\//.test(v);
        const cell = isUrl ? `<a href="${v}">${v}</a>` : v;
        return `<tr><td style="padding:4px 16px 4px 0;color:#64748b;white-space:nowrap;">${k}</td><td style="padding:4px 0;font-weight:600;">${cell}</td></tr>`;
      })
      .join('') +
    `</table>`;
  return { text, html };
}

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
  const { text, html } = buildEmailBody(subject, payload);

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
          text,
          html,
          notificationType: type,
          ...payload,
        },
      }),
    });
  } catch (err) {
    console.error('[notification] dispatch failed', err);
  }
}
