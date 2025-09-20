## PWA & Offline
- PWA manifest: `apps/web/public/manifest.json` (start_url `/?source=twa`, display `standalone`)
- Service Worker: `apps/web/public/sw.js` (cache-first shell, network-first `/api/*`)
- Offline fallback: `apps/web/public/offline.html`
- Registrace SW: `apps/web/src/pwa.ts` + import v `src/main.tsx`
- Test lokálně: 
  ```sh
  npm -w @holly/web run build && npm -w @holly/web run preview
  # otevři v prohlížeči -> DevTools -> Application -> Service Workers

# PWA & Offline

## Offline režim
Holly 2.0 web podporuje PWA a offline režim:
- Manifest (`public/manifest.json`) s barvami Holly, standalone režim, ikony 192x192/512x512.
- Service worker (`public/sw.js`) – cache-first pro shell, network-first pro API a HTML navigace.
- Ikony v `public/` (placeholdery, lze nahradit).
- `index.html` obsahuje PWA metatagy, manifest, theme barvu, ikony.
- Registrace SW v `src/main.tsx` (pouze v produkci).
- Zachován `start_url` a `scope` pro TWA kompatibilitu (`/?source=twa`).

## Test: Registrace SW
Spusť build a preview, ověř registraci service workeru:

```sh
npm run build
npm run preview
# Otevři devtools > Application > Service Workers
# Alternativně:
npm run pwa:check
```

## Poznámky
- Pro offline fallback přidej `/offline.html` do shellu a public.
- Pro TWA je nutné zachovat `start_url` s parametrem.

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
