import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Las locales (tests/e2e/, sin versionar) y las de la cátedra (tests-catedra/e2e/).
  testDir: '.',
  testMatch: ['tests/e2e/**/*.spec.ts', 'tests-catedra/e2e/**/*.spec.ts'],
  retries: 1, // el servidor de desarrollo bajo carga da fallos intermitentes que no se reproducen aislados
  workers: 1, // un solo servidor de desarrollo simulado: en paralelo hay fallos intermitentes
  use: { baseURL: 'http://localhost:5173' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm dev --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
});
