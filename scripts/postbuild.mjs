// GitHub Pages has no SPA rewrites: serve the app shell for unknown paths so deep links survive a refresh.
import { copyFileSync, writeFileSync } from 'node:fs'

copyFileSync('dist/index.html', 'dist/404.html')
writeFileSync('dist/.nojekyll', '')
console.log('postbuild: wrote dist/404.html and dist/.nojekyll')
