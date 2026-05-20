import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotifyService {
  private readonly log = new Logger(NotifyService.name);

  constructor(private readonly config: ConfigService) {}

  async dispatch(body: Record<string, unknown>) {
    const base = this.config.get<string>('NOTIFICATION_SERVICE_URL')?.replace(/\/$/, '');
    const key = this.config.get<string>('INTERNAL_API_KEY');
    if (!base || !key) {
      this.log.warn('NOTIFICATION_SERVICE_URL or INTERNAL_API_KEY not set — skipping notify');
      return null;
    }

    void this.sendInBackground(base, key, body);
    return { accepted: true, queued: true };
  }

  private async sendInBackground(
    base: string,
    key: string,
    body: Record<string, unknown>,
  ) {
    try {
      const r = await fetch(`${base}/api/v1/internal/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-key': key },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        this.log.warn(`Notify failed: ${r.status} ${await r.text()}`);
      }
    } catch (e) {
      this.log.warn(`Notify error: ${e instanceof Error ? e.message : e}`);
    }
  }
}
