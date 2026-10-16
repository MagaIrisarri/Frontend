import { expect, test, type Page } from '@playwright/test';

// Búsqueda por zona: el cliente escribe una ciudad o barrio, el listado se filtra y el mapa se encuadra sobre esos resultados.
// Coordenadas reales: San Nicolás de los Arroyos queda a ~60 km de Rosario, fuera de la vista inicial del mapa.
const API = 'http://localhost:3000';

const parking = (id: string, name: string, neighborhood: string, locality: string, latitude: number, longitude: number, price: number) => ({
  id, name, neighborhood, locality, latitude, longitude,
  province: locality === 'Rosario' ? 'Santa Fe' : 'Buenos Aires',
  address: `Calle ${id}`,
  postalCode: locality === 'Rosario' ? '2000' : '2900',
  openingTime: '08:00', closingTime: '22:00',
  minReservationHours: 1, maxReservationHours: 12, reservationMargin: 15,
  carCapacity: 10, motorcycleCapacity: 0, truckCapacity: 0,
  availableCarSpaces: 5, isActive: true,
  prices: [{ id: `${id}-a`, vehicleType: 'AUTO', price }],
});

const ROSARIO = [
  parking('r1', 'Central Plaza', 'Centro', 'Rosario', -32.9472, -60.6385, 1800),
  parking('r2', 'Pichincha Norte', 'Pichincha', 'Rosario', -32.9395, -60.6520, 1700),
];
const SAN_NICOLAS = [
  parking('s1', 'Cochera Plaza Mitre', 'Centro', 'San Nicolás de los Arroyos', -33.3335, -60.2118, 1500),
  parking('s2', 'Costanera San Nicolás', 'Costanera', 'San Nicolás de los Arroyos', -33.3298, -60.2058, 1400),
  parking('s3', 'Parking Avenida Savio', 'Savio', 'San Nicolás de los Arroyos', -33.3418, -60.2192, 1200),
];

async function setup(page: Page) {
  await page.route(`${API}/**`, (route) => {
    const req = route.request();
    const cors = { 'access-control-allow-origin': '*' };
    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: { ...cors, 'access-control-allow-methods': '*', 'access-control-allow-headers': '*' } });
    }
    const pathname = new URL(req.url()).pathname;
    const body = pathname === '/api/parkings/active' ? { data: [...ROSARIO, ...SAN_NICOLAS] } : pathname === '/api/notifications' ? { data: [], unread: 0 } : { message: 'no mock' };
    return route.fulfill({ status: 'data' in body ? 200 : 404, contentType: 'application/json', headers: cors, body: JSON.stringify(body) });
  });
  await page.goto('/');
}

const search = (page: Page, q: string) => page.getByRole('searchbox', { name: 'Buscar cochera o zona' }).fill(q);
const list = (page: Page) => page.getByRole('complementary', { name: 'Listado de estacionamientos' });

// Precios de los pines que quedan dentro de la pantalla (el mapa ocupa toda la ventana); espera a que termine el encuadre.
async function visiblePins(page: Page) {
  const { width, height } = page.viewportSize()!;
  const out: string[] = [];
  for (const pin of await page.locator('.pin').all()) {
    const b = await pin.boundingBox();
    if (b && b.x >= 0 && b.y >= 0 && b.x + b.width <= width && b.y + b.height <= height) out.push((await pin.innerText()).replace(/\s+/g, ' '));
  }
  return out.sort();
}

test.describe('Búsqueda por zona', () => {
  test('sin búsqueda, el mapa encuadra las dos ciudades', async ({ page }) => {
    await setup(page);
    await page.getByRole('button', { name: /Ver listado|Ver Lista/ }).click();
    await expect(list(page).getByText('5 resultados')).toBeVisible();
    await expect(list(page).getByLabel('Localidad')).toHaveValue(''); // se ven las dos ciudades: no fija ninguna
    // Con todas las cocheras el mapa encuadra las dos ciudades: cada una se agrupa en un cluster.
    await expect.poll(() => page.locator('.cluster').allInnerTexts(), { timeout: 10_000 }).toEqual(expect.arrayContaining([expect.stringContaining('3 cocheras')]));
  });

  test('"San Nicolás" filtra el listado y encuadra el mapa sobre sus tres cocheras', async ({ page }) => {
    await setup(page);
    await search(page, 'san nicolas'); // sin tilde ni mayúsculas
    await page.getByRole('button', { name: /Ver listado|Ver Lista/ }).click();
    await expect(list(page).getByText('3 resultados')).toBeVisible();
    for (const p of SAN_NICOLAS) await expect(list(page).getByText(p.name)).toBeVisible();
    for (const p of ROSARIO) await expect(list(page).getByText(p.name)).toHaveCount(0);

    // Las tres cocheras se ven como pines sueltos (zoom de barrio, no de provincia) y no queda ningún pin de Rosario.
    await expect.poll(() => visiblePins(page), { timeout: 10_000 }).toEqual(['desde $1.200/h', 'desde $1.400/h', 'desde $1.500/h']);
    await expect(page.locator('.cluster')).toHaveCount(0);
  });

  test('ciudad y barrio juntos: "centro san nicolas" no trae el Centro de Rosario', async ({ page }) => {
    await setup(page);
    await search(page, 'centro san nicolas');
    await page.getByRole('button', { name: /Ver listado|Ver Lista/ }).click();
    await expect(list(page).getByText('1 resultado')).toBeVisible();
    await expect(list(page).getByText('Cochera Plaza Mitre')).toBeVisible();
    await expect.poll(() => visiblePins(page), { timeout: 10_000 }).toEqual(['desde $1.500/h']);
  });

  test('volver de San Nicolás a Rosario mueve el mapa de nuevo', async ({ page }) => {
    await setup(page);
    await search(page, 'san nicolas');
    await expect.poll(() => visiblePins(page), { timeout: 10_000 }).toHaveLength(3);
    await search(page, 'rosario');
    await expect.poll(() => visiblePins(page), { timeout: 10_000 }).toEqual(['desde $1.700/h', 'desde $1.800/h']);
  });

  test('la provincia también se busca: "buenos aires" trae solo San Nicolás', async ({ page }) => {
    await setup(page);
    await search(page, 'buenos aires');
    await page.getByRole('button', { name: /Ver listado|Ver Lista/ }).click();
    await expect(list(page).getByText('3 resultados')).toBeVisible();
    await expect(list(page).getByText('Calle s1 · Centro · San Nicolás de los Arroyos')).toBeVisible(); // la tarjeta dice la ciudad
  });
});

test.describe('Buscar en esta zona', () => {
  // Acerca el mapa con la rueda sobre Rosario hasta que San Nicolás (a ~60 km) queda fuera de la pantalla.
  async function zoomIntoRosario(page: Page) {
    const rosario = page.locator('.cluster', { hasText: '2 cocheras' });
    await expect(rosario).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(1000); // termina el encuadre inicial
    // los marcadores se recrean en cada movimiento: se mide hasta obtener una caja
    let b: { x: number; y: number; width: number; height: number } | null = null;
    await expect.poll(async () => (b = await rosario.boundingBox())).not.toBeNull();
    await page.mouse.move(b!.x + b!.width / 2, b!.y + b!.height + 10); // al lado del cluster, no encima (hacer clic en él acerca por código)
    for (let i = 0; i < 3; i++) { // ~3 niveles de zoom: Rosario sigue a la vista y San Nicolás sale
      await page.mouse.wheel(0, -400);
      await page.waitForTimeout(150);
    }
  }

  test('los encuadres automáticos (por texto) no ofrecen el botón', async ({ page }) => {
    await setup(page);
    await search(page, 'san nicolas');
    await expect.poll(() => visiblePins(page), { timeout: 10_000 }).toHaveLength(3);
    await expect(page.getByRole('button', { name: 'Buscar en esta zona' })).toHaveCount(0);
  });

  test('acercarse a Rosario y buscar en esa zona deja solo sus cocheras', async ({ page }) => {
    await setup(page);
    await page.getByRole('button', { name: /Ver listado|Ver Lista/ }).click();
    await expect(list(page).getByText('5 resultados')).toBeVisible();
    await list(page).getByRole('button', { name: 'Cerrar listado' }).click(); // el listado no tapa el mapa mientras se acerca
    await zoomIntoRosario(page);

    const btn = page.getByRole('button', { name: 'Buscar en esta zona' });
    await btn.click();
    await expect(btn).toHaveCount(0);
    await page.getByRole('button', { name: /Ver listado|Ver Lista/ }).click();
    await expect(list(page).getByText('2 resultados en esta zona')).toBeVisible();
    for (const p of ROSARIO) await expect(list(page).getByText(p.name)).toBeVisible();
    for (const p of SAN_NICOLAS) await expect(list(page).getByText(p.name)).toHaveCount(0);

    // "Limpiar filtros" quita la zona
    await list(page).getByRole('button', { name: 'Limpiar filtros' }).click();
    await expect(list(page).getByText('5 resultados')).toBeVisible();
  });

  test('abrir el listado fija la localidad que se ve, sin mover el mapa', async ({ page }) => {
    await setup(page);
    await zoomIntoRosario(page);
    await page.getByRole('button', { name: /Ver listado|Ver Lista/ }).click();
    await expect(list(page).getByLabel('Localidad')).toHaveValue('Santa Fe|Rosario');
    await expect(list(page).getByText('2 resultados', { exact: true })).toBeVisible();
    // No hubo encuadre automático: el botón de la zona sigue ofrecido
    await expect(page.getByRole('button', { name: 'Buscar en esta zona' })).toBeVisible();

    // Elegir otra localidad a mano manda sobre la vista
    await list(page).getByLabel('Localidad').selectOption({ label: 'San Nicolás de los Arroyos' });
    await expect(list(page).getByText('3 resultados', { exact: true })).toBeVisible();
  });

  test('escribir en el buscador descarta la zona: el texto manda y mueve el mapa', async ({ page }) => {
    await setup(page);
    await zoomIntoRosario(page);
    await page.getByRole('button', { name: 'Buscar en esta zona' }).click();
    await search(page, 'san nicolas');
    await page.getByRole('button', { name: /Ver listado|Ver Lista/ }).click();
    await expect(list(page).getByText('3 resultados', { exact: true })).toBeVisible();
    await expect.poll(() => visiblePins(page), { timeout: 10_000 }).toEqual(['desde $1.200/h', 'desde $1.400/h', 'desde $1.500/h']);
  });
});
