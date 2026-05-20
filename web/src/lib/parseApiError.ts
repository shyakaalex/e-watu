export type ParsedApiError = {
  title: string;
  message: string;
  code?: string;
  variant: 'error' | 'warning';
};

const FRIENDLY_BY_CODE: Record<
  string,
  Pick<ParsedApiError, 'title' | 'message' | 'variant'>
> = {
  RATE_LIMIT_EXCEEDED: {
    title: 'Please wait before trying again',
    message:
      'Too many sign-in attempts were made. For your security, sign-in is paused for about 15 minutes. You can try again later or reset your password if you forgot it.',
    variant: 'warning',
  },
};

function fromNestMessage(message: string): ParsedApiError | null {
  const lower = message.toLowerCase();
  if (lower.includes('invalid email or password')) {
    return {
      title: 'Sign-in failed',
      message: 'The email or password you entered is incorrect. Please check your details and try again.',
      variant: 'error',
    };
  }
  if (lower.includes('deactivated')) {
    return {
      title: 'Account unavailable',
      message: 'This account has been deactivated. Contact your administrator if you need access restored.',
      variant: 'error',
    };
  }
  if (lower.includes('verify your email') || lower.includes('email verification')) {
    return {
      title: 'Email not verified',
      message: message,
      variant: 'warning',
    };
  }
  return null;
}

function extractPayload(raw: string): Record<string, unknown> | null {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Turn API / fetch error bodies into user-facing copy (never raw JSON). */
export function parseApiError(e: unknown): ParsedApiError {
  const raw = e instanceof Error ? e.message : String(e);

  const payload = extractPayload(raw);
  if (payload) {
    const nested = payload.error;
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      const err = nested as { code?: string; message?: string };
      if (err.code && FRIENDLY_BY_CODE[err.code]) {
        return { ...FRIENDLY_BY_CODE[err.code], code: err.code };
      }
      if (typeof err.message === 'string' && err.message.trim()) {
        return {
          title: 'Something went wrong',
          message: err.message,
          code: err.code,
          variant: 'error',
        };
      }
    }

    const topMessage = payload.message;
    if (typeof topMessage === 'string' && topMessage.trim()) {
      const friendly = fromNestMessage(topMessage);
      if (friendly) return friendly;
      return { title: 'Something went wrong', message: topMessage, variant: 'error' };
    }
    if (Array.isArray(topMessage)) {
      return {
        title: 'Please fix the following',
        message: topMessage.join(' '),
        variant: 'error',
      };
    }
  }

  if (raw.startsWith('{') || raw.startsWith('[')) {
    return {
      title: 'Something went wrong',
      message: 'We could not complete your request. Please try again in a moment.',
      variant: 'error',
    };
  }

  const friendly = fromNestMessage(raw);
  if (friendly) return friendly;

  return {
    title: 'Something went wrong',
    message: raw || 'An unexpected error occurred. Please try again.',
    variant: 'error',
  };
}
