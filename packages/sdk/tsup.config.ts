// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],  // Remove lucide-react from external
  treeshake: true,
  minify: true,
  outDir: 'dist',
  esbuildOptions(options) {
    options.banner = {
      js: `"use client";`,  // Add React server components support
    }
  },
});