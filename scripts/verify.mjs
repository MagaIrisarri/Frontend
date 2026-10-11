// Arnés de verificación: un paso falla y se corta. Se corre al cerrar cada paso de una migración.
//   pnpm verify          estándar + tipos + build + e2e (si hay carpeta e2e/, que es local y no se versiona)
//   pnpm verify --fast   sin e2e
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const fast = process.argv.includes('--fast');
const run = (name, cmd, args) => {
  const t = Date.now();
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: true });
  const s = ((Date.now() - t) / 1000).toFixed(1);
  if (r.status !== 0) {
    console.error(`\n✗ ${name} falló (${s} s)`);
    process.exit(r.status ?? 1);
  }
  console.log(`✓ ${name} (${s} s)\n`);
};

run('Estándar visual', 'node', ['scripts/check-standard.mjs']);
run('Tipos y build', 'pnpm', ['build']);
if (fast) console.log('· e2e omitido (--fast)');
else if (existsSync('e2e')) run('e2e (Playwright)', 'pnpm', ['exec', 'playwright', 'test', '--reporter=line']);
else console.log('· e2e omitido: no hay carpeta e2e/ (las pruebas son locales)');
console.log('✓ Verificación completa');
