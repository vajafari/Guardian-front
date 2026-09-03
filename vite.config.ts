import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Serves the dev server over https so its origin (https://localhost:5173)
  // shares a scheme with the backend (https://localhost:44318) — browsers'
  // "schemeful same-site" rule otherwise treats http/https as cross-site
  // even on the same host, which breaks SameSite cookies like the
  // captcha session cookie. The generated cert is self-signed and cached
  // per-project; the browser will ask you to trust/proceed past it once.
  plugins: [react(), basicSsl()],
})
