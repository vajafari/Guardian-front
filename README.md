# Guardian

React + TypeScript + Vite admin shell with a login page and a protected dashboard.

## Stack

- React 19 + TypeScript
- Vite
- react-router-dom (client-side routing + route guarding)
- Axios, talking to a real backend — see [Backend integration](#backend-integration)
- Auth state via React Context, persisted to `localStorage`
- react-i18next (English / Persian / Arabic, with RTL support)
- Tailwind CSS v4 + a small hand-picked UI kit (Button, Card, Input, Form, Alert,
  Menu…) ported from the "Ecme" template — see [UI kit](#ui-kit) below

## Getting started

```bash
npm install
cp .env.example .env
npm run dev
```

Sign-in needs the backend described in [Backend integration](#backend-integration)
running and reachable at `VITE_API_BASE_URL` (see `.env.example`).

The dev server runs on **`https://localhost:5173`** (via
`@vitejs/plugin-basic-ssl` in `vite.config.ts`) — see
[HTTPS in dev](#https-in-dev) for why. Its self-signed cert isn't trusted by
the OS, so the first visit needs you to click through the browser's "your
connection isn't private" warning (Advanced → Proceed) once per browser
profile.

## Project structure

```
src/
  api/
    config.ts          # API_BASE_URL (from VITE_API_BASE_URL) + endpoint paths
    authService.ts      # login()/logout()/refreshSession() — /api/core/Auth/*
    accountService.ts    # changePassword()/getCaptchaImage() — Account + Captcha
    httpClient.ts        # axios instance for *authenticated* calls: attaches the
                          # bearer token, refreshes + retries once on a 401
    tokenStorage.ts       # localStorage helpers shared by AuthContext and httpClient
  context/
    AuthContext.tsx      # auth state, token/user persistence, login()/logout()
  routes/
    ProtectedRoute.tsx    # redirects to /login when unauthenticated
  i18n/
    index.ts              # i18next setup (en / fa / ar, browser language detection)
    locales/{en,fa,ar}.json
  hooks/
    useSyncDocumentDirection.ts   # keeps <html dir/lang> in sync with the active language
  components/
    ui/            # hand-picked component kit, see "UI kit" below
    Header.tsx
    Footer.tsx
    SideMenu.tsx    # right-hand navigation panel, pinned to the physical right in RTL too
    UserMenu.tsx    # header dropdown (username) holding ThemeToggle, LanguageSwitcher,
                    # Change password, logout
    ChangePasswordDialog.tsx
    ThemeToggle.tsx  # light/dark switch, see "Dark mode" below
    LanguageSwitcher.tsx   # EN / FA / AR toggle
  pages/
    LoginPage.tsx
    DashboardPage.tsx   # Header + main + SideMenu + Footer
  styles/
    theme.css        # Tailwind import + config + CSS custom-property theme (colors, base type)
    components.css    # component-layer CSS (.button, .card, .input, .menu-item, ...)
  types/
    auth.ts
  App.tsx        # route table, wraps everything in the ui kit's ConfigProvider
  main.tsx       # app entry, wraps App in BrowserRouter
```

## Internationalization

Three languages are wired up: English (`en`), Persian (`fa`) and Arabic (`ar`).
The language switcher (login page and dashboard header) persists the choice to
`localStorage` under `guardian.language`; on first visit it falls back to the
browser's language, then to English.

`fa` and `ar` are right-to-left. `useSyncDocumentDirection` sets `<html dir>` /
`<html lang>` whenever the language changes, and the layout uses CSS logical
properties (`inset-inline-*`, `border-inline-*`, flex order) rather than
`left`/`right`, so the whole UI — including the side menu — mirrors correctly
in RTL instead of needing separate RTL stylesheets.

Persian also gets its own typeface: `src/styles/fonts.css` declares `@font-face`
for IRANSans (files served from `public/fonts/`, not bundled through Vite's
asset pipeline, so plain absolute `url(/fonts/...)` references work without
any import-chain rebasing issues) and scopes it with `html[lang='fa'] { font-family: ... }`.
English and Arabic keep the plain system-font stack from `tailwind.config.cjs`.

To add a new UI string: add the key to all three files in `src/i18n/locales/`,
then read it with `useTranslation()`'s `t()`. Auth error messages are looked
up the same way, keyed by the error `code` from `AuthError`
(`src/types/auth.ts`) rather than a hardcoded string, so they translate too.

## UI kit

`src/components/ui/` is a small, self-contained set of presentational
components (`Button`, `Card`, `Input`, `InputGroup`, `Form`/`FormItem`, `Alert`,
`Spinner`, `Menu`/`MenuItem`, `Dropdown`, `Dialog`, `ConfigProvider`, ...) ported as-is from a
purchased admin template ("Ecme" by themenate — see the license that shipped
with it for usage terms). Only the presentational layer was taken; all
app logic (auth, i18n, routing) stays hand-written in Guardian.

These components read a `direction` / `controlSize` / `locale` from
`ConfigProvider`, which `App.tsx` wires up to the active i18n language, so
they automatically follow the app's RTL state — no separate theming needed.

Styling is Tailwind CSS v4 (`tailwind.config.cjs`, `postcss.config.cjs`) plus
two files under `src/styles/`: `theme.css` (color tokens as CSS custom
properties, so dark mode / re-theming is a matter of changing variables) and
`components.css` (the `@apply`-based classes each component's `className`
prop about, e.g. `.button`, `.card`, `.menu-item`).

Only the subset needed by the current pages was copied over — the source
template has a much larger set (DatePicker, Table, Tabs, Dialog, Select,
Avatar, ...). To pull in another component, copy its folder from
`Guardian Template/TypeScript/starter/src/components/ui/<Name>` into
`src/components/ui/<Name>`, add its CSS block from
`.../assets/styles/components/_<name>.css` into `src/styles/components.css`,
and re-export it from `src/components/ui/index.ts`.

## Dark mode

`ThemeContext`/`ThemeProvider` (`src/context/ThemeContext.tsx`) track
light/dark, persist the choice to `localStorage` (`guardian.theme`), and
toggle the `dark` class on `<html>` — the same `darkMode: 'class'` strategy
Tailwind's already configured with, so every `dark:` utility in the ui kit
and app code just works. A small inline script in `index.html` applies the
class before React mounts to avoid a flash of the wrong theme. `ThemeToggle`
is the sun/moon button; it lives in `UserMenu` (header) and on the login
page.

## HTTPS in dev

`vite.config.ts` loads `@vitejs/plugin-basic-ssl` so `npm run dev` serves
over `https://localhost:5173` instead of http. This isn't just cosmetic: the
backend runs on `https://localhost:44318`, and the captcha flow's session
cookie (`cidcn`) needs the two origins to be **same-site**, which browsers
determine by registrable domain *and* scheme together ("schemeful
same-site"). `http://localhost:5173` vs `https://localhost:44318` differ in
scheme, so browsers treated them as cross-site even though both are
"localhost" — which silently drops cookies unless the backend opts them all
the way out to `SameSite=None`. Matching the scheme is the actual fix;
`SameSite=None; Secure` on the backend's cookie (kept regardless — see
below) is what makes it work even across the differing *ports*, which still
count as different origins.

The cert this plugin generates is self-signed and unknown to the OS/browser
trust store, so on a fresh browser profile you'll see a certificate warning
on first visit — click through it (Chrome: Advanced → Proceed to
localhost). This is different from the backend's ASP.NET Core dev cert,
which gets trusted once via `dotnet dev-certs https --trust`; there's no
equivalent one-time trust step for `basic-ssl`'s cert short of importing it
into the OS store by hand, so the click-through repeats per fresh profile.

Switching the dev server's scheme changes its origin string, so the
backend's CORS `WithOrigins(...)` needs `https://localhost:5173`, not
`http://localhost:5173` — see the prerequisites below.

## Backend integration

Guardian talks to a real backend now (no more mocked auth). The base URL comes
from the `VITE_API_BASE_URL` env var. `.env` is git-ignored (each machine
points at its own backend) — copy `.env.example` to `.env` and adjust it
locally. Vite only reads `.env*` files at startup, so restart `npm run dev`
after changing it.

**Sign-in** — `POST {VITE_API_BASE_URL}/api/core/Auth/Token` with
`{ userId, secret }` (mapped from the username/password form fields),
returning `{ token, refreshToken, entityTitle, isOtpRequired }`. If
`isOtpRequired` comes back `true`, login is rejected with an `otp-required`
error — there's no OTP-entry step built yet.

**Token refresh** — the access token is an *encrypted* JWT (`alg: dir`), so
its expiry can't be read client-side; refreshing is reactive rather than
timer-based. `httpClient.ts` (an axios instance meant for future authenticated
endpoints — nothing calls it yet, since the dashboard has no real data calls
of its own) attaches `Authorization: Bearer <token>` to every request via a
request interceptor, and its response interceptor calls
`POST /api/core/Auth/RefreshToken` with `{ refreshToken }` on a 401, queueing
any other requests that 401 while a refresh is already in flight so only one
refresh call goes out, then retries the original request(s) with the new
token. If the refresh call itself fails (or there's no refresh token), the
session is cleared and `AuthContext` is notified via a
`guardian:session-expired` window event — `ProtectedRoute` then redirects to
`/login` on the next render.

**Sign-out** — clicking "Log out" (in `UserMenu`) calls
`POST /api/core/Auth/Logout` with the current `Authorization: Bearer <token>`
header and an empty body, best-effort: the local session is cleared and the
user is sent back to `/login` regardless of whether that call succeeds.

**Change password** — "Change password" (in `UserMenu`) opens a `Dialog`
(`src/components/ChangePasswordDialog.tsx`) with old/new/confirm-password
fields plus a captcha: it fetches `GET /api/Captcha/CaptchaImage` (a PNG,
requires the bearer token too) as a blob and shows it via an object URL,
refetching on open, on the refresh button, and after every failed attempt
(the captcha is single-use). Submitting calls
`POST /api/core/Account/ChangePasswordByUser` with
`{ oldPassword, newPassword, securityImage }` via `httpClient` — the first
real use of its automatic bearer-token/401-refresh handling.
`src/api/accountService.ts` maps failures to a `ChangePasswordError`
(`src/types/account.ts`), the same pattern as `AuthError`.

The captcha image request sets an `HttpOnly` session cookie (`cidcn`,
`SameSite=None; Secure`) that ties the generated image to the
`securityImage` value checked later, so both the image fetch and the
change-password POST go out with `withCredentials: true` — see
[HTTPS in dev](#https-in-dev) and the CORS/credentials prerequisite below
for why that cookie needs those exact settings.

**Local dev prerequisites** (all outside this repo, on the backend):
- CORS must allow the Vite origin — **`https://localhost:5173`** now that
  the dev server runs on https (was `http://localhost:5173`; update
  `WithOrigins(...)` if it still has the old scheme) — or the browser blocks
  requests at the preflight step even though they're otherwise correct.
- The captcha/change-password calls are credentialed (`withCredentials: true`,
  to carry the `cidcn` cookie), which additionally requires
  `Access-Control-Allow-Credentials: true` on those endpoints' CORS policy —
  and the origin can't be a wildcard (`*`) once credentials are involved.
- That cookie needs `SameSite=None` + `Secure` (not `Strict`/`Lax`) to
  survive being set and read back across two different ports, even though
  both are now `https://localhost`.
- The backend's HTTPS dev certificate needs to be trusted
  (`dotnet dev-certs https --trust` for an ASP.NET Core backend), or requests
  fail with a certificate error before they even reach CORS.

The refresh endpoint path/payload (`/api/core/Auth/RefreshToken` with
`{ refreshToken }`) is inferred from the `/Auth/Token` naming convention, not
confirmed against a real response — if the actual backend differs, only
`AUTH_ENDPOINTS.refreshToken` in `src/api/config.ts` and the request body in
`refreshSession()` (`src/api/authService.ts`) need to change.

## Available scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check (`tsc -b`) and build for production
- `npm run lint` — run Oxlint
- `npm run preview` — preview the production build locally

## Next steps

- Confirm the real `/api/core/Auth/RefreshToken` contract against the backend
  (see [Backend integration](#backend-integration)) and adjust
  `src/api/config.ts`/`authService.ts` if it differs from the guess made here.
- Build an OTP-entry step, or drop the `isOtpRequired` check if this backend
  never needs it for admin accounts.
- CI (lint + build on push).
