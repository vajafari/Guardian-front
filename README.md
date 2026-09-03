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

## Project structure

```
src/
  api/
    config.ts          # API_BASE_URL (from VITE_API_BASE_URL) + auth endpoint paths
    authService.ts      # login()/refreshSession() — real calls to /api/core/Auth/*
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
    UserMenu.tsx    # header dropdown (username) holding ThemeToggle, LanguageSwitcher, logout
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
`Spinner`, `Menu`/`MenuItem`, `Dropdown`, `ConfigProvider`, ...) ported as-is from a
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

**Local dev prerequisites** (both outside this repo, on the backend):
- CORS must allow the Vite origin (`http://localhost:5173` by default) — the
  backend needs a policy that returns `Access-Control-Allow-Origin` for it,
  or the browser blocks the `Auth/Token` request at the preflight step even
  though the request itself is correct.
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
