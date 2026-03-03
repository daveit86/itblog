# Security Documentation

This document outlines the security measures implemented in the IT Blog application.

## Implemented Security Features

### 1. Authentication & Authorization

#### NextAuth.js Configuration
- **JWT-based sessions**: Secure token-based authentication
- **Session expiry**: 7 days (reduced from 30 for better security)
- **SameSite cookies**: Set to `strict` to prevent CSRF attacks
- **Secure cookie prefix**: Uses `__Secure-` prefix in production
- **HTTP-only cookies**: Prevents XSS access to session tokens
- **No hardcoded credentials**: Removed default admin credentials

#### Role-Based Access Control (RBAC)
- Admin role verification on all admin routes
- Session validation on all protected API endpoints
- Middleware protection for admin layout

### 2. Rate Limiting

Implemented using `rate-limiter-flexible`:

| Endpoint Type | Limit | Duration |
|--------------|-------|----------|
| Login attempts | 5 requests | 15 minutes |
| Comment submissions | 3 requests | 1 hour |
| File uploads | 10 requests | 1 hour |
| Admin actions | 50 requests | 1 minute |
| General API | 100 requests | 1 minute |

Rate limits return proper HTTP 429 status with Retry-After headers.

### 3. File Upload Security

- **MIME type validation**: Only allows images (jpeg, png, gif, webp) and PDF
- **File signature validation**: Verifies magic numbers to prevent MIME spoofing
- **Extension whitelist**: Validates file extensions
- **Size limits**: Maximum 5MB per file
- **Secure filenames**: Cryptographically random names (16 bytes hex + timestamp)
- **Path traversal protection**: Resolves and validates upload paths
- **Automatic directory creation**: Ensures uploads directory exists

### 4. Security Headers

All pages include these security headers:

```
X-DNS-Prefetch-Control: on
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self'; media-src 'self'; object-src 'none'; frame-ancestors 'self'; base-uri 'self'; form-action 'self';
```

API routes additionally include:
```
Cache-Control: no-store, max-age=0
```

### 5. Input Validation

- **Zod schemas**: All API endpoints validate input with Zod
- **SQL injection prevention**: Uses Prisma ORM with parameterized queries
- **XSS protection**: React automatically escapes content
- **Comment length limits**: Maximum 5000 characters
- **Form data validation**: Type-safe parsing of form submissions

### 6. Audit Logging

All admin actions are logged to the database:
- Article create, update, delete, publish, unpublish
- Comment approve, disapprove, delete
- User management actions
- Backup/restore operations
- Bulk actions

Logs include:
- User ID
- Action type
- Resource type and ID
- Timestamp
- IP address
- User agent
- Additional details (JSON)

### 7. Database Security

- **Prisma ORM**: Prevents SQL injection
- **Cascading deletes**: Properly configured in schema
- **Field validation**: Database-level constraints
- **Encrypted storage**: SQLite with proper permissions

### 8. Environment Security

Required environment variables:
```bash
# Database
DATABASE_URL="file:./prisma/dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-here"  # Use setup script

# Admin Credentials (must be configured)
ADMIN_EMAIL="your-email@example.com"
ADMIN_PASSWORD="your-secure-password"  # Will be hashed

# Email notifications
ADMIN_NOTIFICATION_EMAIL="admin@example.com"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Security Setup

### 1. Generate Secure Secrets

Run the setup script:
```bash
node scripts/setup-security.js
```

This generates:
- `NEXTAUTH_SECRET`: 64-byte cryptographically secure random string
- `ADMIN_PASSWORD`: Strong memorable password
- `ENCRYPTION_KEY`: For future encryption needs

### 2. Configure Environment Variables

1. Copy the generated secrets
2. Create `.env.local` file (NOT `.env`)
3. Add your actual email address as `ADMIN_EMAIL`
4. Never commit `.env.local` to git

### 3. Run Database Migrations

```bash
npx prisma migrate dev --name add_audit_log
```

### 4. Verify Security Headers

Test your deployment:
```bash
curl -I https://your-domain.com
```

Check for all security headers.

## Security Checklist

Before deploying to production:

- [ ] Generate new NEXTAUTH_SECRET
- [ ] Set strong ADMIN_PASSWORD
- [ ] Change default ADMIN_EMAIL
- [ ] Configure SMTP for email notifications
- [ ] Enable HTTPS
- [ ] Set NODE_ENV=production
- [ ] Review CSP policy for your needs
- [ ] Test rate limiting
- [ ] Verify audit logs are working
- [ ] Check file upload restrictions
- [ ] Review user roles and permissions

## Security Best Practices

1. **Regular Updates**
   - Keep dependencies updated: `npm audit fix`
   - Monitor security advisories
   - Update Prisma client regularly

2. **Access Control**
   - Use strong, unique passwords
   - Enable 2FA if possible
   - Regularly review admin users
   - Remove unused accounts

3. **Monitoring**
   - Check audit logs regularly
   - Monitor failed login attempts
   - Review rate limit violations
   - Watch for unusual activity

4. **Backups**
   - Regular database backups
   - Secure backup storage
   - Test restore procedures
   - Encrypt sensitive backups

5. **Incident Response**
   - Have a plan for security incidents
   - Know how to revoke sessions
   - Document rollback procedures
   - Keep contact information updated

## Reporting Security Issues

If you discover a security vulnerability:

1. Do NOT open a public issue
2. Email security concerns to: [your-security-email]
3. Include detailed description and reproduction steps
4. Allow reasonable time for response before disclosure

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/architecture/security)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/security)
- [NextAuth Security](https://next-auth.js.org/tutorials/securing-pages-and-api-routes)
