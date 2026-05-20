import { parseApiError } from '../../lib/parseApiError';

export function parseError(e: unknown): string {
  const { title, message } = parseApiError(e);
  return title === 'Something went wrong' ? message : `${title}: ${message}`;
}
