import path from 'node:path';
import { transformWithOxc } from 'vite';
import { defineConfig } from 'vitest/config';

// Next.js allows JSX inside .js files, but Vite only reads JSX in .jsx files by default.
// This plugin tells it to read our own .js files as JSX, so the tests can import them.
const jsxInJsFiles = {
  name: 'jsx-in-js-files',
  enforce: 'pre',
  transform(code, id) {
    const isOurFile = /\/(src|tests)\/.*\.js$/.test(id) && !id.includes('node_modules');

    return isOurFile ? transformWithOxc(code, id, { lang: 'jsx' }) : null;
  },
};

export default defineConfig({
  plugins: [jsxInJsFiles],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  test: { environment: 'jsdom', include: ['tests/**/*.test.js'] },
});