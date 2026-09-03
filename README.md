# Guardian

React + TypeScript + Vite admin shell with a login page and a protected dashboard.

## Stack

- React 19 + TypeScript
- Vite
- react-router-dom (client-side routing + route guarding)
- Auth state via React Context, persisted to `localStorage`

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
  components/
    Header.tsx / Header.css
    Footer.tsx / Footer.css
    SideMenu.tsx / SideMenu.css   # right-hand navigation panel
  pages/
    LoginPage.tsx / LoginPage.css
    DashboardPage.tsx / DashboardPage.css   # Header + main + SideMenu + Footer
  types/
    auth.ts
  App.tsx        # route table
  main.tsx       # app entry, wraps App in BrowserRouter
```

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
