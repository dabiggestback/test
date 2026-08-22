# Google Classroom setup for Knoll

This build adds Google OAuth + Google Classroom through Cloudflare Pages Functions.

## Cloudflare Pages variables/secrets

After deploying this version, open:

**Workers & Pages → Knoll Pages project → Settings → Variables and Secrets**

Add these for the **Production** environment:

### Plain-text variable

`GOOGLE_CLIENT_ID`

Value: your Google OAuth Web Client ID.

### Encrypted secret

`GOOGLE_CLIENT_SECRET`

Value: the Google OAuth Web Client Secret.

### Encrypted secret

`KNOLL_SESSION_SECRET`

Value: a long random secret used to encrypt the Classroom session cookie.

On a computer with Node.js installed, you can generate one with:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Do not commit or publish the Client Secret or session secret.

## Google OAuth redirect URI

The Google OAuth Web Client must have this exact authorized redirect URI:

`https://knoll.bigback.org/auth/google/callback`

## What the integration requests

The app requests:

- OpenID identity
- Basic Google profile/email information
- `https://www.googleapis.com/auth/classroom.courses.readonly`
- `https://www.googleapis.com/auth/classroom.coursework.me.readonly`

The Classroom permissions are read-only.

## Routes added

- `/auth/google` — starts Google OAuth
- `/auth/google/callback` — completes OAuth and creates the encrypted session
- `/auth/logout` — clears the Classroom session
- `/api/classroom` — returns the signed-in user's active courses and upcoming assignments

The Google refresh token is stored only inside an encrypted, HttpOnly, Secure session cookie. It is not placed in the public JavaScript files.
