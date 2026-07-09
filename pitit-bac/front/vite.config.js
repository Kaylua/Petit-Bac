import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    // Nécessaire pour que les dépendances locales (file:) soient résolues correctement
    preserveSymlinks: true,
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Permet à sass de résoudre "bulma/..." et "buefy/..." sans préfixe ~
        // (le ~ était une convention webpack/sass-loader, pas supportée nativement par Vite)
        loadPaths: [resolve('node_modules')],
      },
    },
  },
})
