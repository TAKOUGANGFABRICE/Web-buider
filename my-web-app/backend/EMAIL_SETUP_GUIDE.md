# Bot Protection Setup — reCAPTCHA

## Why reCAPTCHA?
Email verification was removed because you cannot reliably receive emails. reCAPTCHA protects registration from automated bots without requiring email delivery.

---

## reCAPTCHA Versions

| Version | User Experience | Best For |
|---------|----------------|----------|
| reCAPTCHA v3 | Invisible, score-based | Seamless UX, backend decides |
| reCAPTCHA v2 | "I'm not a robot" checkbox | Visible confirmation, simple |

**Recommended:** reCAPTCHA v3 (invisible) with score threshold 0.5

---

## Step-by-Step Setup

### Step 1: Create Keys

1. Visit [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin/create)
2. Create new site
   - Label: `WaaS Project`
   - Type: reCAPTCHA v3 (or v2)
   - Domains: Add `localhost` (dev) and your production domain(s)
3. Accept terms → Submit
4. Copy **Site Key** and **Secret Key**

### Step 2: Backend Configuration

Edit `backend/.env`:

```bash
RECAPTCHA_SITE_KEY=YOUR_SITE_KEY_HERE
RECAPTCHA_SECRET_KEY=YOUR_SECRET_KEY_HERE
RECAPTCHA_SCORE_THRESHOLD=0.5  # Optional
```

### Step 3: Frontend Configuration

Edit `frontend/.env`:

```bash
REACT_APP_RECAPTCHA_SITE_KEY=YOUR_SITE_KEY_HERE
```

Restart frontend: `npm start`

### Step 4: Verify Setup

1. Backend logs should show no errors on startup
2. Frontend loads reCAPTCHA script (check browser console for `grecaptcha` object)
3. Registration form submits with token

---

## How Registration Flow Works

1. User fills out registration form (username, email, password)
2. Frontend calls `grecaptcha.execute()` → Google returns token
3. Token included as `recaptcha_token` in POST `/api/register/`
4. Backend verifies token with Google (`https://www.google.com/recaptcha/api/siteverify`)
5. If score ≥ threshold (or token valid for v2), user is created
6. User auto-login → dashboard

No email is sent during this flow.

---

## Development Without reCAPTCHA

During local development (DEBUG=True) with no `RECAPTCHA_SECRET_KEY`:
- Backend skips reCAPTCHA verification
- Registration works without a token
- Useful for testing without setting up keys

Note: When `RECAPTCHA_SECRET_KEY` is set, token becomes mandatory (even in DEBUG mode).

---

## Adjusting Sensitivity (reCAPTCHA v3)

For reCAPTCHA v3, Google returns a score (0.0 = likely bot, 1.0 = likely human).

Adjust threshold based on your traffic:
- Strict: `RECAPTCHA_SCORE_THRESHOLD=0.7` (fewer false positives)
- Balanced: `RECAPTCHA_SCORE_THRESHOLD=0.5` (default)
- Lenient: `RECAPTCHA_SCORE_THRESHOLD=0.3` (fewer false negatives)

Change in `.env` and restart backend.

---

## Common Issues

### "reCAPTCHA verification required"
Cause: Frontend did not send `recaptcha_token`.
Fix: Ensure reCAPTCHA script loads and `grecaptcha.execute()` is called before form submit.

### "reCAPTCHA verification failed"
Cause: Invalid secret key or site key mismatch.
Fix: Double-check keys in both `.env` files; regenerate if needed.

### "reCAPTCHA score too low"
Cause: Automated traffic detected.
Fix: Lower threshold; legitimate users with assistive tech may score lower.

### No reCAPTCHA script loaded
Check console for 404s. Verify `REACT_APP_RECAPTCHA_SITE_KEY` is correct and script tag added to `public/index.html`.

---

## Files Changed

- `backend/.env.example` — added reCAPTCHA variables
- `backend/backend/settings.py` — reCAPTCHA configuration
- `backend/core/views.py` — reCAPTCHA validation in RegisterView
- `backend/core/serializers.py` — added `recaptcha_token` field
- `frontend/.env` — reCAPTCHA site key
- `frontend/public/index.html` — reCAPTCHA script tag
- `frontend/src/Register.js` — token fetch and submission
- Removed: VerifyEmail component, email verification endpoints, related models and tests

---

## Production Checklist

- [ ] Obtain reCAPTCHA keys for production domain
- [ ] Update both `.env` files with production keys
- [ ] Set `RECAPTCHA_SCORE_THRESHOLD` appropriately
- [ ] Ensure DEBUG=False in production
- [ ] Test registration flow end-to-end
- [ ] Monitor reCAPTCHA dashboard for suspicious patterns

---

## Need Help?

- reCAPTCHA docs: https://developers.google.com/recaptcha
- Check backend logs for verification errors
- Use browser DevTools → Network to inspect `recaptcha_token` in request payload
