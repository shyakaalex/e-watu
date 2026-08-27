import { authFetch, parseJson, serviceUrl } from './lib/http';

export type Notification = {
  id: string;
  userId: string;
  tenantId: string | null;
  title: string;
  body: string;
  channel: string;
  readAt: string | null;
  createdAt: string;
};

async function notificationFetch(path: string, init?: RequestInit): Promise<Response> {
  const r = await authFetch(`${serviceUrl('notification')}${path}`, init);
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r;
}

export async function fetchNotifications(unreadOnly = false): Promise<Notification[]> {
  const r = await notificationFetch(`/api/v1/notifications${unreadOnly ? '?unread=true' : ''}`);
  return parseJson(r);
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const r = await notificationFetch('/api/v1/notifications/unread-count');
  const { count } = await parseJson<{ count: number }>(r);
  return count;
}

export async function markNotificationRead(id: string): Promise<void> {
  await notificationFetch(`/api/v1/notifications/${id}/read`, { method: 'PATCH' });
}
