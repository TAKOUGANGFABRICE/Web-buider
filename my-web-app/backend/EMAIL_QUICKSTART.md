# reCAPTCHA Setup Guide (Bot Protection)

## Overview
Email verification has been replaced with Google reCAPTCHA to prevent bot registrations without requiring email delivery.

reCAPTCHA verifies that the user is human during registration. No email verification step.

---

## Setup Steps

### 1. Get reCAPTCHA API Keys (Free)

1. Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin/create)
2. Click **+ Create**
3. Enter a label (e.g., "WaaS Backend")
4. Select **reCAPTCHA v3** (invisible, score-based) or **reCAPTCHA v2** (checkbox)
5. Add your domains:
   - Development: `localhost`
   - Production: `yourdomain.com` and `www.yourdomain.com`
6. Accept terms and submit
7. Copy **Site Key** and **Secret Key**

### 2. Add Keys to Backend `.env`

```bash
# Backend .env (backend/.env)
RECAPTCHA_SITE_KEY=your-site-key-from-google
RECAPTCHA_SECRET_KEY=your-secret-key-from-google
RECAPTCHA_SCORE_THRESHOLD=0.5  # Optional (0.0-1.0), default 0.5
```

### 3. Add Site Key to Frontend `.env`

```bash
# Frontend .env (frontend/.env)
REACT_APP_RECAPTCHA_SITE_KEY=your-site-key-from-google
```

### 4. Restart Both Servers

```bash
# Terminal 1 - Backend
cd backend
python manage.py runserver

# Terminal 2 - Frontend
cd frontend
npm start
```

---

## How It Works

1. User fills registration form
2. Frontend executes reCAPTCHA (invisible) and gets a token
3. Token sent with registration request
4. Backend verifies token with Google API
5. If score passes threshold, account created immediately
6. User logged in automatically – no email step

For reCAPTCHA v3:
- Score 0.0-1.0 (higher = more human-like)
- Threshold default 0.5; adjust in `.env` if needed
- Action name optional; currently not used

For reCAPTCHA v2 (checkbox):
- Token validation passes; score ignored

---

## Development Without reCAPTCHA

If `RECAPTCHA_SECRET_KEY` is empty in development:
- Backend bypasses reCAPTCHA verification
- Registration works without token (if DEBUG=True)
- Ideal for local testing

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "reCAPTCHA verification required" | Ensure frontend loads reCAPTCHA script and grecaptcha.execute() returns token |
| "reCAPTCHA score too low" | Lower `RECAPTCHA_SCORE_THRESHOLD` (e.g., 0.3) or check bot traffic |
| Token not sent | Frontend: verify `window.grecaptcha` is defined; check site key is valid |
| Backend ignores reCAPTCHA | Set `RECAPTCHA_SECRET_KEY` in .env and restart server |

---

## Configuration Reference

- `RECAPTCHA_SITE_KEY` — Frontend key (public)
- `RECAPTCHA_SECRET_KEY` — Backend key (private, never exposed)
- `RECAPTCHA_SCORE_THRESHOLD` — Minimum score for v3 (default 0.5)

---

## Security Notes

- Use **reCAPTCHA v3** for invisible protection
- Monitor score logs in your Google reCAPTCHA dashboard
- Combine with rate limiting (already in login views)
- Consider 2FA (TOTP) for sensitive operations
