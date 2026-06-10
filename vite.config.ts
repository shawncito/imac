import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // expose to LAN (0.0.0.0) so other devices on same wifi can connect
    strictPort: false, // if 5173 is busy, auto-try 5174, 5175, ...
  },
})
