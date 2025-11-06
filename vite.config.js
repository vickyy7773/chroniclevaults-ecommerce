import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    // Let Vite handle env variables naturally - don't override them
    define: {
      // Only define if you need to override, otherwise Vite handles it automatically
    }
  }
})



