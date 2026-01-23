# Supabase Email Invite Setup

## Overview
The admin invite system uses Supabase's built-in email invitation feature. Users receive an email with a magic link that authenticates them and redirects to the join page.

## Configuration Steps

### 1. Configure Email Templates in Supabase Dashboard

Go to: **Authentication > Email Templates** in your Supabase dashboard

### 2. Customize the "Invite User" Template

Update the template with your branding:

```html
<h2>Welcome to CHALKBOARD!</h2>

<p>You've been invited to join {{ .SiteURL }}!</p>

<p>Click the link below to accept your invitation and get started:</p>

<p><a href="{{ .ConfirmationURL }}">Accept Invitation</a></p>

<p>This link will authenticate you and take you directly to complete your profile.</p>

<p>If you didn't expect this invitation, you can safely ignore this email.</p>
```

### 3. Important Variables

- `{{ .ConfirmationURL }}` - This contains the magic link with the redirect URL we set in the API
- `{{ .SiteURL }}` - Your app's base URL
- `{{ .Token }}` - The confirmation token (automatically handled)

### 4. Redirect URL Configuration

The invite API automatically sets the redirect URL to:
```
https://yourapp.com/join/[orgId]
```

When users click the email link:
1. Supabase authenticates them
2. They're redirected to `/join/[orgId]`
3. They complete onboarding (profile, team, position)

## Testing

### Development Testing
1. Make sure `NEXT_PUBLIC_APP_URL` is set to `http://localhost:3000` in `.env.local`
2. Go to `/admin/settings`
3. Enter email addresses using the tag-based input:
   - Type an email and press Space, Enter, or Comma to create a tag
   - Paste multiple emails at once (they'll auto-convert to tags)
   - Click the X on any tag to remove it
4. Select role (Coach or Player)
5. Click "Send Invitations"
6. Watch the progress bar as invitations are sent
7. Review the results showing which emails succeeded/failed
8. Check your email inbox(es)
9. Click the invite link
10. You should be redirected to `/join/[orgId]` already authenticated

### Bulk Invitations with Tag-Based UI
The system supports sending invitations to multiple people at once with a modern tag-based interface:

**Adding Emails:**
- Type an email address and press Space, Enter, or Comma to create a tag
- Each email becomes a visual tag with an X button to remove it
- Paste multiple emails at once: `player1@example.com, player2@example.com, coach@example.com`
- Pasted emails automatically convert to individual tags
- Press Backspace when input is empty to remove the last tag

**Managing Tags:**
- Click the X on any tag to remove that specific email
- Use "Clear all" button to remove all tags at once (appears when 2+ tags)
- Invalid emails are rejected with an alert
- Duplicate emails are prevented automatically
- See a live count: "5 emails added"

**Sending:**
- Invitations are sent sequentially to avoid rate limits
- Real-time progress bar shows "Sending X of Y..."
- Results display shows success/failure for each email with checkmarks/X icons
- Failed invites show specific error messages

### Production
1. Update `NEXT_PUBLIC_APP_URL` to your production domain
2. Update Supabase email templates with your branding
3. Ensure email sender is configured (Supabase > Settings > Auth > SMTP Settings)

## Email Customization

You can customize:
- Email subject line
- Email body HTML
- Sender name (configure SMTP settings)
- Reply-to address

## Troubleshooting

### Email not sending
- Check Supabase email rate limits
- Verify SMTP settings if using custom email provider
- Check Supabase logs: Dashboard > Logs

### Wrong redirect URL
- Verify `NEXT_PUBLIC_APP_URL` is set correctly
- Check the API is reading the environment variable
- Look for `[Admin Invite] Sending invite to: ...` in server logs

### User can't complete onboarding
- Verify they're authenticated (check session in browser dev tools)
- Check that invite code (org ID) in URL is valid
- Look for errors in browser console
