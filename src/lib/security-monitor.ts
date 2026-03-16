import * as Sentry from "@sentry/nextjs";

/**
 * Security monitoring utilities for tracking security events
 */

export function trackSecurityEvent(event: {
  type: 'suspicious_activity' | 'rate_limit_exceeded' | 'auth_failure' | 'privilege_escalation_attempt';
  message: string;
  data?: Record<string, any>;
}) {
  Sentry.captureMessage(event.message, {
    level: 'warning',
    tags: {
      security: 'true',
      event_type: event.type,
    },
    extra: event.data,
  });
}

export function trackAuthFailure(email: string, reason: string) {
  Sentry.captureMessage(`Authentication failure for ${email}`, {
    level: 'warning',
    tags: {
      security: 'true',
      event_type: 'auth_failure',
    },
    extra: { reason },
  });
}

export function trackRateLimitExceeded(endpoint: string, identifier: string) {
  Sentry.captureMessage(`Rate limit exceeded on ${endpoint}`, {
    level: 'warning',
    tags: {
      security: 'true',
      event_type: 'rate_limit_exceeded',
    },
    extra: { endpoint, identifier },
  });
}

export function trackSuspiciousActivity(message: string, data?: Record<string, any>) {
  Sentry.captureMessage(message, {
    level: 'warning',
    tags: {
      security: 'true',
      event_type: 'suspicious_activity',
    },
    extra: data,
  });
}

export function trackError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

export { Sentry };
