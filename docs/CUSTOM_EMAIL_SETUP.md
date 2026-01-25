## Custom email for bulk user creation

The **bulk create users** workflow (`/api/admin/bulk-create-users`) creates users via Supabase Admin API and sends a **custom email** (including the initial password) using **Resend**.

### Required environment variables

- `RESEND_API_KEY`: your Resend API key
- `EMAIL_FROM`: sender, e.g. `Chalkboard <noreply@yourdomain.com>`
- `NEXT_PUBLIC_APP_URL`: base URL used to generate the login/join link (local Next route)
- `URL`: Netlify site URL fallback (Netlify function)

### Resend setup

1. Create a Resend account and verify a sending domain.
2. Create an API key and set `RESEND_API_KEY` in Netlify + local `.env.local`.
3. Set `EMAIL_FROM` to a verified sender.

### Email content

The email includes:
- the recipient email
- the initial password (as provided by the admin)
- a link to `login?redirect=/join/[orgId]`

### Security note

Sending passwords over email is generally discouraged. If you later want a more secure flow, we can switch to:
- sending a one-time “set password” link, or
- sending a magic link + forcing password change on first login.

