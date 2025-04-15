import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        open: true,
    },
    define: {
        'import.meta.env': process.env,
    },
});