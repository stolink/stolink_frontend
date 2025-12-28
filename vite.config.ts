import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          "vendor-react": ["react", "react-dom", "react-router-dom"],

          // UI component libraries
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-label",
            "@radix-ui/react-select",
            "@radix-ui/react-separator",
            "@radix-ui/react-slot",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-progress",
          ],

          // Tiptap core
          "vendor-editor-core": [
            "@tiptap/core",
            "@tiptap/react",
            "@tiptap/starter-kit",
          ],

          // Tiptap extensions (lazy load 가능)
          "vendor-editor-extensions": [
            "@tiptap/extension-bubble-menu",
            "@tiptap/extension-character-count",
            "@tiptap/extension-highlight",
            "@tiptap/extension-mention",
            "@tiptap/extension-placeholder",
            "@tiptap/extension-text-align",
            "@tiptap/extension-underline",
            "@tiptap/suggestion",
          ],

          // Graph visualization (큰 라이브러리)
          "vendor-graph": ["d3", "reactflow"],

          // Export libraries (사용 시에만 로드)
          "vendor-export": ["docx", "jspdf", "epub-gen-memory", "file-saver"],

          // State management
          "vendor-query": ["@tanstack/react-query"],

          // Animation
          "vendor-motion": ["framer-motion"],

          // Utilities
          "vendor-utils": [
            "axios",
            "zustand",
            "date-fns",
            "clsx",
            "tailwind-merge",
            "lodash-es",
            "uuid",
          ],

          // DnD
          "vendor-dnd": ["@dnd-kit/core", "@dnd-kit/sortable"],

          // Form & validation
          "vendor-form": ["react-hook-form", "@hookform/resolvers", "zod"],

          // Image & file processing
          "vendor-media": [
            "browser-image-compression",
            "react-dropzone",
            "iconv-lite",
          ],

          // Other UI utilities
          "vendor-ui-utils": [
            "@tippyjs/react",
            "tippy.js",
            "lucide-react",
            "class-variance-authority",
          ],
        },

        // Chunk naming strategy
        chunkFileNames: () => {
          return `assets/js/[name]-[hash].js`;
        },
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
      },
    },

    // Performance optimizations
    target: "es2015",
    minify: "esbuild",
    cssCodeSplit: true,

    // Chunk size warnings
    chunkSizeWarningLimit: 1000,

    // Disable source maps for smaller bundle
    sourcemap: false,

    // Optimize dependencies
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
});
