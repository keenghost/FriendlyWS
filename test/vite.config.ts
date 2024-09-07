import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 11111,
    host: '127.0.0.1',
    proxy: {
      '/ws34721': {
        target: 'ws://127.0.0.1:34721',
        changeOrigin: true,
        ws: true,
      },
      '/ws34722': {
        target: 'ws://127.0.0.1:34722',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
