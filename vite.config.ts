import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { metaImagesPlugin } from "./vite-plugin-meta-images";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    metaImagesPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core React runtime — cached across all pages
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor-react';
          }
          // Scheduler (React dependency)
          if (id.includes('node_modules/scheduler')) {
            return 'vendor-react';
          }
          // Data fetching layer
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'vendor-query';
          }
          // Animation library — only loaded when needed
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion';
          }
          // Router
          if (id.includes('node_modules/wouter')) {
            return 'vendor-router';
          }
          // Radix UI components — separate cacheable chunk
          if (id.includes('node_modules/@radix-ui')) {
            return 'vendor-radix';
          }
          // Class variance authority (used by shadcn)
          if (id.includes('node_modules/class-variance-authority') || id.includes('node_modules/clsx') || id.includes('node_modules/tailwind-merge')) {
            return 'vendor-ui-utils';
          }
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
