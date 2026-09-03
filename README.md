# Guardian

React + TypeScript + Vite admin shell with a login page and a protected dashboard.

## Stack

- React 19 + TypeScript
- Vite
- react-router-dom (client-side routing + route guarding)
- Auth state via React Context, persisted to `localStorage`
- react-i18next (English / Persian / Arabic, with RTL support)
- Tailwind CSS v4 + a small hand-picked UI kit (Button, Card, Input, Form, Alert,
  Menu…) ported from the "Ecme" template — see [UI kit](#ui-kit) below

## Getting started

```bash
npm install
npm run dev
```

Log in with any username and a password of 4+ characters — the auth service is currently mocked (see below).

## Project structure

```
src/
  api/
    authService.ts      # mocked login call — returns a fake JWT
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
    SideMenu.tsx   # right-hand navigation panel (mirrors to the left in RTL)
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
then read it with `useTranslation()`'s `t()`. Mock-auth error messages are
looked up the same way, keyed by the error `code` from `AuthError`
(`src/types/auth.ts`) rather than a hardcoded string, so they translate too.

## UI kit

`src/components/ui/` is a small, self-contained set of presentational
components (`Button`, `Card`, `Input`, `InputGroup`, `Form`/`FormItem`, `Alert`,
`Spinner`, `Menu`/`MenuItem`, `ConfigProvider`, ...) ported as-is from a
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
template has a much larger set (DataPicker, Table, Tabs, Dialog, Select,
Avatar, Dropdown, ...). To pull in another component, copy its folder from
`Guardian Template/TypeScript/starter/src/components/ui/<Name>` into
`src/components/ui/<Name>`, add its CSS block from
`.../assets/styles/components/_<name>.css` into `src/styles/components.css`,
and re-export it from `src/components/ui/index.ts`.

## Mock auth service

`src/api/authService.ts` fakes a `POST /auth/login` call: it validates the inputs,
waits ~600ms, and resolves a locally-generated (unsigned) JWT-shaped token plus a
user object. It has the same shape a real API client would have, so swapping it
for a real `fetch`/`axios` call later shouldn't require touching `AuthContext` or
the pages that call `login()`.

## Available scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check (`tsc -b`) and build for production
- `npm run lint` — run Oxlint
- `npm run preview` — preview the production build locally

## Next steps

See the setup notes shared alongside this repo for suggested next steps
(real backend integration, refresh tokens, CI, etc.).
