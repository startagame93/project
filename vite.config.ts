import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as { version: string };
// Same "major.minor" shown inside the app and used as Android versionName.
const SHORT_VERSION = pkg.version.split('.').slice(0, 2).join('.');
const APP_LABEL = `NutriPlan ${SHORT_VERSION}`;

// Stamps the version into the name shown under the installed icon and refreshes the offline cache on every release.
function versionedAppName(): Plugin {
  let outDir = 'dist';
  return {
    name: 'versioned-app-name',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    transformIndexHtml(html) {
      return html.replace(/(<meta name="apple-mobile-web-app-title" content=")[^"]*(")/, `$1${APP_LABEL}$2`);
    },
    closeBundle() {
      const manifestPath = `${outDir}/manifest.json`;
      if (existsSync(manifestPath)) {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
        manifest.name = `${APP_LABEL} - Dieta e Nutrizione`;
        manifest.short_name = APP_LABEL;
        writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      }
      const swPath = `${outDir}/sw.js`;
      if (existsSync(swPath)) {
        const sw = readFileSync(swPath, 'utf-8').replace(/const CACHE_NAME = '[^']*'/, `const CACHE_NAME = 'nutriplan-${pkg.version}'`);
        writeFileSync(swPath, sw);
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), versionedAppName()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react', 'pdfjs-dist'],
  },
});
