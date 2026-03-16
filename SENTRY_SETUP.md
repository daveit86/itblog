# Sentry Security Monitoring Setup Guide

This guide will help you set up Sentry for security monitoring and error tracking in your IT Blog.

## What is Sentry?

Sentry is a cloud-based error monitoring and performance tracking platform. It helps you:
- Track errors and exceptions in real-time
- Monitor application performance
- Receive alerts when issues occur
- Track security events
- Debug production issues faster

## Setup Instructions

### Step 1: Create Sentry Account

1. Go to https://sentry.io/signup/
2. Sign up with your email or GitHub account
3. Choose the free plan (or paid plan for larger projects)

### Step 2: Create a Project

1. In Sentry dashboard, click "Create Project"
2. Select "Next.js" as the platform
3. Give your project a name (e.g., "itblog")
4. Click "Create Project"

### Step 3: Get Your DSN

After creating the project, you'll see a page with your DSN (Data Source Name). It looks like:
```
https://abc123@o123456.ingest.sentry.io/1234567
```

### Step 4: Configure Environment Variables

Add these to your `.env.local` file:

```env
SENTRY_DSN="https://your-dsn-here"
SENTRY_ORG="your-organization-slug"
SENTRY_PROJECT="your-project-slug"
```

Replace the values with your actual Sentry project details.

To find your organization and project slugs:
- Go to your Sentry project settings
- The URL will be: `https://sentry.io/settings/your-org/projects/your-project/`
- Your org slug is `your-org`
- Your project slug is `your-project`

### Step 5: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Trigger a test error by visiting:
   ```
   http://localhost:3000/api/sentry-example-api
   ```

3. Check your Sentry dashboard - you should see the error appear

## Security Monitoring Features

### Automatic Error Tracking

Sentry automatically captures:
- Unhandled exceptions
- API route errors
- Client-side JavaScript errors
- Performance issues

### Security Events

We've added custom security monitoring in `src/lib/security-monitor.ts`:

```typescript
import { trackSecurityEvent, trackAuthFailure, trackRateLimitExceeded } from '@/lib/security-monitor';

// Track authentication failures
trackAuthFailure(userEmail, 'Invalid password');

// Track rate limit violations
trackRateLimitExceeded('/api/comments', userId);

// Track suspicious activity
trackSecurityEvent({
  type: 'suspicious_activity',
  message: 'Multiple failed login attempts',
  data: { attempts: 5, ip: '192.168.1.1' }
});
```

### What's Being Monitored

1. **Authentication Events**
   - Failed login attempts
   - Rate limiting violations
   - Privilege escalation attempts

2. **API Errors**
   - 500 Internal Server Errors
   - Database connection issues
   - External service failures

3. **Performance**
   - Slow API responses
   - Client-side rendering performance
   - Database query performance

4. **User Feedback**
   - Users can submit feedback directly from error pages
   - Screenshots and descriptions included

## Configuration Options

### Adjust Sample Rates

In `sentry.client.config.ts`:

```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Reduce sampling in production to save quota
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Only capture replays for errors in production
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1,
});
```

### Filter Sensitive Data

Sentry is already configured to remove sensitive data:
- Cookies
- Authorization headers
- Passwords
- User emails (in certain contexts)

### Environment Filtering

Sentry will only send events when `SENTRY_DSN` is set. For local development without Sentry, simply don't set the environment variables.

## Alert Configuration

### Set Up Email Alerts

1. Go to your Sentry project settings
2. Click "Alerts" in the sidebar
3. Click "Create Alert Rule"
4. Configure conditions:
   - "When: An issue is first seen"
   - "Then: Send an email to team"
5. Click "Save Rule"

### Slack Integration (Optional)

1. In Sentry, go to Settings → Integrations
2. Find Slack and click "Add to Workspace"
3. Follow the OAuth flow
4. Configure which events to send to Slack

### PagerDuty Integration (Optional)

For critical production issues:
1. Go to Settings → Integrations
2. Find PagerDuty and click "Add Installation"
3. Configure alert rules for critical errors only

## Best Practices

### 1. Don't Commit DSN to Git

The DSN is already in `.env.local` which is in `.gitignore`. Never commit it to version control.

### 2. Use Different Projects for Environments

Create separate Sentry projects:
- `itblog-production`
- `itblog-staging`
- `itblog-development`

### 3. Set Up Release Tracking

Sentry automatically tracks releases based on your Git commits. This helps you identify which deployment introduced an error.

### 4. Monitor Performance Budgets

Set performance thresholds in Sentry:
- API response time > 500ms
- Page load time > 3 seconds
- Database query time > 100ms

### 5. Regular Review

Schedule weekly reviews of:
- New errors
- Error trends
- Performance regressions
- Security events

## Troubleshooting

### No Errors Appearing in Sentry

1. Check that `SENTRY_DSN` is set correctly
2. Verify you're in the correct Sentry organization/project
3. Check browser console for Sentry initialization errors
4. Ensure you're not using ad-blockers that might block Sentry

### Too Many Events (Quota Exceeded)

1. Reduce `tracesSampleRate` to 0.1 or lower
2. Filter out specific error types in `beforeSend`
3. Upgrade to a paid plan

### Source Maps Not Working

1. Ensure you're deploying with source maps enabled
2. Check that the release version matches between build and Sentry
3. Upload source maps manually if needed:
   ```bash
   npx @sentry/cli releases files upload-sourcemaps --release=<release> ./.next/static
   ```

## Privacy Considerations

- Sentry is configured to NOT collect:
  - User passwords
  - Credit card numbers
  - Session cookies
  - Authorization headers
- User IP addresses are collected for rate limiting but can be disabled
- You can add additional PII filtering in `beforeSend`

## Next Steps

1. **Set up alerts** for critical errors
2. **Configure Slack integration** for team notifications
3. **Add custom security events** where needed
4. **Review errors weekly** to catch issues early
5. **Set up performance monitoring** dashboards

## Support

- Sentry Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Next.js specific: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
- Sentry Support: https://sentry.io/support/

---

**Your application is now configured for security monitoring with Sentry!** 🛡️
