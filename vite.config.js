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
    },
    build: {
      // Optimize chunk size
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor chunks for better caching
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['lucide-react'],
            // Split admin pages into separate chunk (lazy loaded)
            'admin': [
              './src/components/layout/AdminLayout.jsx',
              './src/pages/admin/Dashboard.jsx',
              './src/pages/admin/ProductManagement.jsx',
              './src/pages/admin/OrderManagement.jsx',
              './src/pages/admin/UserManagement.jsx',
              './src/pages/admin/Settings.jsx',
            ],
          },
        },
      },
    },
  }
})



