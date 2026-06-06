# reCAPTCHA Configuration Guide

## Current Status: ✅ CONFIGURED & FUNCTIONAL

reCAPTCHA v3 is now fully configured with Google's **test keys** for development. This means:

- ✅ reCAPTCHA runs on registration, login, password reset, and magic login
- ✅ All requests pass reCAPTCHA validation (test keys always succeed)
- ✅ You can test the complete flow without errors
- ⚠️ In production, you MUST replace test keys with real ones

---

## Protected Endpoints

reCAPTCHA verification is enforced on the following endpoints:

| Endpoint | Method | Purpose | Token Required |
|----------|--------|---------|----------------|
| `/api/register/` | POST | User registration | Yes |
| `/api/login/` | POST | User login (regular & 2FA) | Yes |
| `/api/password-reset/` | POST | Request password reset | Yes |
| `/api/password-reset/confirm/` | POST | Confirm password reset | Yes |
| `/api/magic-login/` | POST | Request magic login link | Yes |

---

## Configuration Details

### Backend (`backend/.env`)
```bash
RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhVI
RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
RECAPTCHA_SCORE_THRESHOLD=0.5
```

### Frontend (`.env`)

```bash
REACT_APP_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhVI
```

These are Google's public test keys for reCAPTCHA v3. They work in any environment and always return a successful verification.

---

## How It Works

### Registration Flow with reCAPTCHA

1. User fills out registration form
2. Frontend loads reCAPTCHA script dynamically (if not already loaded)
3. Frontend calls `grecaptcha.execute(site_key)` → gets token
4. Token sent as `recaptcha_token` in POST `/api/register/`
5. Backend verifies token with Google's API using secret key
6. If verification succeeds (score ≥ threshold), user is created
7. User is automatically logged in and redirected to dashboard

### Login Flow with reCAPTCHA

Same as registration, but for `/api/login/` endpoint. Works for both:
- Regular login (username/password)
- 2FA login (username/password + verification code)

---

## Production Setup

### Step 1: Get reCAPTCHA Keys

1. Visit [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin/create)
2. Create new site:
   - **Label**: Your app name (e.g., "WaaS Production")
   - **Type**: reCAPTCHA v3 (recommended) or reCAPTCHA v2
   - **Domains**: Add your production domain(s) (e.g., `yourdomain.com`, `www.yourdomain.com`)
   - Accept terms → Submit
3. Copy **Site Key** and **Secret Key**

### Step 2: Update Backend `.env`

```bash
# Replace test keys with real ones
RECAPTCHA_SITE_KEY=your_actual_site_key
RECAPTCHA_SECRET_KEY=your_actual_secret_key
RECAPTCHA_SCORE_THRESHOLD=0.5  # Adjust as needed (0.0-1.0)
```

**Important**:
- For **reCAPTCHA v3**: Set score threshold (0.5 recommended)
- For **reCAPTCHA v2**: Score threshold is ignored; only token validity matters

### Step 3: Update Frontend `.env`

```bash
REACT_APP_RECAPTCHA_SITE_KEY=your_actual_site_key
```

### Step 4: Restart Servers

```bash
# Backend
cd backend
python run_server.py

# Frontend
cd frontend
npm start
```

---

## Development vs Production Behavior

| Setting | Development (DEBUG=True) | Production (DEBUG=False) |
|---------|------------------------|------------------------|
| `RECAPTCHA_SECRET_KEY` not set | reCAPTCHA bypassed (no validation) | **ERROR** - Must set secret key |
| `RECAPTCHA_SECRET_KEY` set | reCAPTCHA enforced | reCAPTCHA enforced |
| No token provided | Error: "reCAPTCHA verification required" | Error: "reCAPTCHA verification required" |
| Invalid token | Error: "reCAPTCHA verification failed" | Error: "reCAPTCHA verification failed" |
| Low score (< threshold) | Error: "reCAPTCHA score too low" | Error: "reCAPTCHA score too low" |

**Current**: reCAPTCHA **enforced** (test keys configured)

---

## Testing

### Test Registration with reCAPTCHA

1. Open browser console (F12)
2. Navigate to `http://localhost:3000/register`
3. Fill form and submit
4. Check network tab: Request to `/api/register/` should include `recaptcha_token` field
5. Backend logs: Should show "reCAPTCHA verification succeeded" or similar

### Expected Behavior

- **With valid token (test keys)**: Registration succeeds, user created, auto-login
- **Without token** (manually clear token): Error: "reCAPTCHA verification required"
- **With invalid token** (random string): Error: "reCAPTCHA verification failed"

### Simulate reCAPTCHA Failure

To test error handling, temporarily change the secret key in `.env` to something invalid, restart backend, and try registering. You should see an appropriate error message.

---

## Adjusting Sensitivity (reCAPTCHA v3)

reCAPTCHA v3 returns a score (0.0 = likely bot, 1.0 = likely human).

| Score | Interpretation |
|-------|----------------|
| 0.0 - 0.3 | High confidence bot |
| 0.4 - 0.6 | Uncertain / Suspicious |
| 0.7 - 1.0 | High confidence human |

**Threshold recommendations**:
- **0.7** (strict): Fewer false positives, may block some real users with unusual behavior
- **0.5** (balanced): Good balance (default)
- **0.3** (lenient): Blocks obvious bots, most users pass

Adjust in `backend/.env`: `RECAPTCHA_SCORE_THRESHOLD=0.5`

---

## Troubleshooting

### "reCAPTCHA verification required"
**Cause**: Frontend didn't send `recaptcha_token`.  
**Fix**: Ensure reCAPTCHA script loads and `grecaptcha.execute()` is called. Check browser console for `grecaptcha is not defined` errors.

### "reCAPTCHA verification failed"
**Cause**: 
- Invalid site key or secret key
- Keys mismatch (v2 vs v3)
- Token already used or expired

**Fix**: 
1. Verify keys match in both `.env` files
2. Ensure you're using reCAPTCHA v3 keys for v3 implementation
3. Regenerate keys if needed

### "reCAPTCHA score too low"
**Cause**: Automated traffic detected or user behavior suspicious.  
**Fix**:
- Lower `RECAPTCHA_SCORE_THRESHOLD` (e.g., to 0.3)
- Check if legitimate users are being flagged (adjust accordingly)

### reCAPTCHA script not loading
**Check**:
1. Frontend `.env` has correct `REACT_APP_RECAPTCHA_SITE_KEY`
2. No console 404 errors for `https://www.google.com/recaptcha/api.js`
3. Restart frontend after changing `.env`

### No reCAPTCHA in network request payload
**Cause**: `loadRecaptcha()` not called or fails silently.  
**Debug**: Check browser console for warnings. Ensure `window.grecaptcha` exists after page load.

---

## Files Modified

### Backend
- `backend/.env` - Added reCAPTCHA test keys
- `backend/core/settings.py` - reCAPTCHA configuration (score threshold, etc.)
- `backend/core/serializers.py` - Added `recaptcha_token` fields to:
  - `RegisterSerializer`
  - `PasswordResetRequestSerializer`
  - `PasswordResetConfirmSerializer`
- `backend/core/views.py` - reCAPTCHA validation implemented in:
  - `RegisterView`
  - `LoginView`
  - `PasswordResetRequestView`
  - `PasswordResetConfirmView`
  - `MagicLoginRequestView`
  - `MagicLoginVerifyView`

### Frontend
- `frontend/.env` - Added reCAPTCHA test site key
- `frontend/src/AuthContext.js` - Updated `login()`, `loginWith2fa()`, and `register()` to pass `recaptcha_token`
- `frontend/src/Login.js` - Dynamic reCAPTCHA loading and token execution
- `frontend/src/Register.js` - Dynamic reCAPTCHA loading and token execution
- `frontend/src/ForgotPassword.js` - Dynamic reCAPTCHA loading and token execution
- `frontend/src/ResetPassword.js` - Dynamic reCAPTCHA loading and token execution
- `frontend/src/AuthSettings.js` - Dynamic reCAPTCHA loading for magic link requests

---

## Production Checklist

Before going live:

1. [ ] Obtain reCAPTCHA v3 keys from [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin/create)
2. [ ] Update `backend/.env`:
   ```bash
   RECAPTCHA_SITE_KEY=your_production_site_key
   RECAPTCHA_SECRET_KEY=your_production_secret_key
   RECAPTCHA_SCORE_THRESHOLD=0.5
   ```
3. [ ] Update `frontend/.env`:
   ```bash
   REACT_APP_RECAPTCHA_SITE_KEY=your_production_site_key
   ```
4. [ ] Set `DEBUG=False` in `backend/backend/settings.py`
5. [ ] Test all flows (registration, login, password reset, magic login) with real keys
6. [ ] Monitor reCAPTCHA scores and adjust threshold if needed

---

## Notes

- **Test keys are public and always succeed**. Do NOT use in production.
- reCAPTCHA v3 is invisible to users (no checkbox). Score determines bot likelihood.
- In production, ensure `DEBUG=False` and real keys are set.
- The reCAPTCHA verification makes a server-to-server call to Google, adding ~100-200ms to requests.
- The auto-login after registration now properly includes the recaptcha token to avoid authentication failures.
- Password reset endpoints now protect against automated spam attacks.
- Magic login requests are protected against abuse.

---

## Need Help?

- reCAPTCHA docs: https://developers.google.com/recaptcha
- Test keys info: https://developers.google.com/recaptcha/docs/faq
- Backend logs: Check Django console for reCAPTCHA verification errors
- Browser DevTools: Inspect network request payload for `recaptcha_token` field
