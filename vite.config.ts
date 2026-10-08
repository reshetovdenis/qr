import { defineConfig } from 'vite';
export default defineConfig({ base: './', build: { target: 'es2022', cssCodeSplit: false }, server: { host: '0.0.0.0' } });
