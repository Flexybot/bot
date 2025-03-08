import { Inter } from 'next/font/google';

// Font for general UI text
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
});

// Use system monospace fonts instead of loading Roboto Mono
export const monospaceFallback = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';