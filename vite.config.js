import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        written: resolve(__dirname, 'src/books-written.html'),
        translated: resolve(__dirname, 'src/books-translated.html'),
        contact: resolve(__dirname, 'src/contact.html'),
        bookDetails: resolve(__dirname, 'src/book-details.html'),
      },
    },
  },
  server: {
    port: 3000,
  }
});
