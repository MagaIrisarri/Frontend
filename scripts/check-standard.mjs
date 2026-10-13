// Chequeo estático del estándar visual (ver CLAUDE.md, "Estándar de interfaz").
// Las pantallas migradas se listan en scripts/standard.json; a partir de ahí no pueden volver a Tailwind de color,
// hex sueltos, modales hechos a mano ni alert()/confirm(). Se corre dentro de `pnpm verify`.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(resolve(root, 'scripts/standard.json'), 'utf8'));

const COLORS = 'white|black|zinc|slate|gray|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const TSX_RULES = [
  [new RegExp(`\\b(?:bg|text|border|ring|from|to|via|fill|stroke|divide|shadow|outline|accent|placeholder)-(?:${COLORS})\\b`), 'color de Tailwind: usá tokens var(--…) de las clases del sistema'],
  [/\bdark:/, 'variante dark: el tema ya sale de los tokens'],
  [/['"`]#[0-9a-fA-F]{3,8}['"`]|#[0-9a-fA-F]{6}\b/, 'hex suelto: usá un token'],
  [/import\s*\{[^}]*\b(?:Car|Bike|Truck)\b[^}]*\}\s*from\s*'lucide-react'/, 'íconos de vehículo: usá VICON (components/Owner/ui/vehicles.ts), los mismos que el panel del dueño'],
  [/\bfixed inset-0\b/, 'modal hecho a mano: usá Drawer o ConfirmModal (components/Owner/ui/Layer.tsx)'],
  [/\b(?:window\.)?(?:alert|confirm|prompt)\(/, 'alert/confirm/prompt del navegador: usá useToast o ConfirmModal'],
  [/\b(?:animate-in|zoom-in|slide-in-from|fade-in)\b/, 'clases de animación sin plugin instalado'],
  [/\brounded(?:-[a-z0-9]+)?\b|\bshadow(?:-[a-z0-9/]+)?\b/, 'radio o sombra de Tailwind: usá --r-sm/md/lg y --shadow'],
  [/\bfont-(?:medium|semibold|bold|extrabold|black)\b|\btracking-[a-z]+\b|(?<=[\s"'`])uppercase(?=\s)|\btext-(?:xs|sm|base|lg|xl|\dxl|\[)/, 'tipografía de Tailwind: el sistema fija 14 px / pesos 500-600'],
];
const SCSS_RULES = [[/#[0-9a-fA-F]{3,8}\b(?<!#fff)(?<!#FFF)(?<!#ffffff)/, 'hex suelto en SCSS: solo #fff sobre fondos de acento; el resto son tokens']];

const errors = [];
for (const rel of manifest.files) {
  const file = resolve(root, rel);
  if (!existsSync(file)) { errors.push(`${rel}: está en scripts/standard.json pero no existe (actualizá el manifiesto)`); continue; }
  const rules = rel.endsWith('.scss') ? SCSS_RULES : TSX_RULES;
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    const code = rel.endsWith('.scss') ? line.replace(/\/\*.*?\*\//g, '') : line.replace(/\/\/.*$/, '');
    if (rel.endsWith('.scss') && /^\s*(--[a-z0-9-]+:|\.light\b.*--)/.test(code) && rel.endsWith('base.scss')) return;
    for (const [re, why] of rules) if (re.test(code)) errors.push(`${rel}:${i + 1}: ${why}\n    ${line.trim().slice(0, 140)}`);
  });
}

// Mi perfil es un panel (useOpenProfile), nunca una ruta; tampoco hay páginas de cliente que dupliquen los paneles.
const app = readFileSync(resolve(root, 'src/App.tsx'), 'utf8');
for (const path of manifest.forbiddenRoutes) if (new RegExp(`path="${path.replace(/[/:]/g, '\\$&')}"`).test(app)) errors.push(`src/App.tsx: la ruta ${path} no debe existir (es un panel de Home)`);

// Las rutas de cliente de esas pantallas son atajos que abren el panel sobre Home, no páginas propias.
for (const path of manifest.panelRoutes) {
  const re = new RegExp(`path="${path.replace(/[/:]/g, '\\$&')}" element=\\{<ProtectedRoute[^>]*><HomePage />`); // ProtectedRoute puede restringir roles (allowedRoles)
  if (!re.test(app)) errors.push(`src/App.tsx: la ruta ${path} debe renderizar <HomePage /> (abre su panel), no una página aparte`);
}

// Todo panel y confirmación anima la entrada y la salida: un Drawer o ConfirmModal que se monta con `x && <Drawer/>` desaparece sin
// animar el cierre. Por eso cada archivo que los usa tiene que envolverlos en Presence (o en Shown, que conserva el último valor).
const LAYERS = /<(?:Drawer|ConfirmModal)\b/;
for (const rel of readdirSync(resolve(root, 'src'), { recursive: true })) {
  const path = String(rel).replace(/\\/g, '/');
  if (!/\.tsx$/.test(path) || path.endsWith('Owner/ui/Layer.tsx')) continue;
  const src = readFileSync(resolve(root, 'src', path), 'utf8');
  if (LAYERS.test(src) && !/\b(?:Presence|Shown)\b/.test(src)) errors.push(`src/${path}: usa Drawer o ConfirmModal sin Presence/Shown, el cierre no se anima (components/Owner/ui/Presence.tsx)`);
}

if (errors.length) {
  console.error(`✗ Estándar: ${errors.length} problema(s)\n` + errors.map((e) => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log(`✓ Estándar: ${manifest.files.length} archivos migrados sin desvíos`);
