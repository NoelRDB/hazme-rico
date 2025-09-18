/*
 * Cloudflare Worker para el proyecto "Hazme Rico".
 *
 * Este Worker expone una pequeña API REST para gestionar aportaciones. Los
 * datos se almacenan en un KV Namespace para persistencia simple. No hay
 * integración directa con Bizum; los pagos deben verificarse manualmente en
 * el panel de administración.
 */

export interface Env {
  /**
   * KV namespace enlazado a través de `wrangler.toml`. Se utiliza para
   * almacenar el total recaudado, el precio actual, la lista de
   * contribuyentes y las aportaciones pendientes.
   */
  HAZME_RICO_KV: KVNamespace;
  /** Contraseña de administrador para validar las rutas protegidas. */
  ADMIN_PASS: string;
  /** Origen permitido para CORS (opcional). */
  CORS_ORIGIN?: string;
}

interface Contributor {
  nombre?: string;
  importe: number;
  ts: number;
}

interface Pending {
  id: string;
  nombre?: string;
  importe: number;
  pruebaURL?: string;
  consentName: boolean;
  ts: number;
}

/** Lee un valor JSON del KV o devuelve un valor por defecto si no existe. */
async function readJSON<T>(env: Env, key: string, defaultValue: T): Promise<T> {
  const stored = await env.HAZME_RICO_KV.get(key);
  return stored ? (JSON.parse(stored) as T) : defaultValue;
}

/** Guarda un valor JSON en el KV. */
async function writeJSON(env: Env, key: string, value: unknown): Promise<void> {
  await env.HAZME_RICO_KV.put(key, JSON.stringify(value));
}

/** Convierte un número a string con dos decimales usando punto decimal. */
function toCurrencyString(value: number): string {
  return value.toFixed(2);
}

/** Envuelve una respuesta con cabeceras CORS si procede. */
function withCors(env: Env, resp: Response): Response {
  const origin = env.CORS_ORIGIN;
  if (!origin) {
    return resp;
  }
  const headers = new Headers(resp.headers);
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Pass');
  headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers,
  });
}

/** Genera un ID único simple para aportaciones pendientes. */
function generateId(): string {
  // Utiliza una porción de un UUID v4 para generar un identificador corto.
  // crypto.randomUUID() devuelve una cadena como 8-4-4-4-12. Cogemos la
  // primera parte y la última para mayor entropía.
  const uuid = crypto.randomUUID();
  const parts = uuid.split('-');
  return `${parts[0]}${parts[4]}`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Preflight CORS
    if (request.method === 'OPTIONS') {
      const headers = new Headers();
      if (env.CORS_ORIGIN) {
        headers.set('Access-Control-Allow-Origin', env.CORS_ORIGIN);
        headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Pass');
        headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      }
      return new Response(null, { status: 204, headers });
    }

    // /api/state – obtiene el estado actual (total, precio, contribuyentes)
    if (pathname === '/api/state' && request.method === 'GET') {
      const totalStr = await env.HAZME_RICO_KV.get('hzm:total');
      const priceStr = await env.HAZME_RICO_KV.get('hzm:price');
      const contributors = await readJSON<Contributor[]>(env, 'hzm:contributors', []);
      const total = totalStr ? parseFloat(totalStr) : 0;
      const price = priceStr ? parseFloat(priceStr) : 0.5;
      const body = JSON.stringify({ total, price, contributors });
      return withCors(env, new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }

    // /api/claim – registra una declaración de pago (pendiente de aprobación)
    if (pathname === '/api/claim' && request.method === 'POST') {
      try {
        const data = await request.json();
        const { nombre, importe, pruebaURL, consentName } = data || {};
        // Validaciones básicas
        if (typeof importe !== 'number' || isNaN(importe) || importe < 0.5) {
          return withCors(env, new Response(JSON.stringify({ error: 'importe inválido' }), { status: 400, headers: { 'Content-Type': 'application/json' } }));
        }
        if (nombre && typeof nombre !== 'string') {
          return withCors(env, new Response(JSON.stringify({ error: 'nombre inválido' }), { status: 400, headers: { 'Content-Type': 'application/json' } }));
        }
        if (pruebaURL && typeof pruebaURL !== 'string') {
          return withCors(env, new Response(JSON.stringify({ error: 'pruebaURL inválida' }), { status: 400, headers: { 'Content-Type': 'application/json' } }));
        }
        const pending = await readJSON<Pending[]>(env, 'hzm:pending', []);
        const id = generateId();
        const entry: Pending = {
          id,
          nombre: nombre ? nombre.trim().slice(0, 40) : undefined,
          importe: parseFloat(importe.toFixed(2)),
          pruebaURL: pruebaURL ? pruebaURL.trim().slice(0, 200) : undefined,
          consentName: !!consentName,
          ts: Date.now(),
        };
        pending.push(entry);
        await writeJSON(env, 'hzm:pending', pending);
        return withCors(env, new Response(JSON.stringify({ ok: true, id }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      } catch (err) {
        return withCors(env, new Response(JSON.stringify({ error: 'cuerpo inválido' }), { status: 400, headers: { 'Content-Type': 'application/json' } }));
      }
    }

    // Rutas de administración
    if (pathname.startsWith('/api/admin/')) {
      const pass = request.headers.get('x-admin-pass');
      if (!pass || pass !== env.ADMIN_PASS) {
        return withCors(env, new Response(JSON.stringify({ error: 'no autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } }));
      }
      // /api/admin/pending – lista aportaciones pendientes
      if (pathname === '/api/admin/pending' && request.method === 'GET') {
        const pending = await readJSON<Pending[]>(env, 'hzm:pending', []);
        return withCors(env, new Response(JSON.stringify({ pending }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      // /api/admin/approve – aprueba una aportación pendiente
      if (pathname === '/api/admin/approve' && request.method === 'POST') {
        const data = await request.json();
        const { id } = data || {};
        if (!id || typeof id !== 'string') {
          return withCors(env, new Response(JSON.stringify({ error: 'id inválido' }), { status: 400, headers: { 'Content-Type': 'application/json' } }));
        }
        const pending = await readJSON<Pending[]>(env, 'hzm:pending', []);
        const idx = pending.findIndex((p) => p.id === id);
        if (idx === -1) {
          return withCors(env, new Response(JSON.stringify({ error: 'no encontrado' }), { status: 404, headers: { 'Content-Type': 'application/json' } }));
        }
        const item = pending[idx];
        pending.splice(idx, 1);
        await writeJSON(env, 'hzm:pending', pending);
        // actualizar total y precio
        const totalStr = await env.HAZME_RICO_KV.get('hzm:total');
        const priceStr = await env.HAZME_RICO_KV.get('hzm:price');
        let total = totalStr ? parseFloat(totalStr) : 0;
        let price = priceStr ? parseFloat(priceStr) : 0.5;
        total += item.importe;
        price = parseFloat((price + 0.01).toFixed(2));
        await env.HAZME_RICO_KV.put('hzm:total', toCurrencyString(total));
        await env.HAZME_RICO_KV.put('hzm:price', toCurrencyString(price));
        // actualizar contribuyentes
        const contributors = await readJSON<Contributor[]>(env, 'hzm:contributors', []);
        const contributor: Contributor = {
          nombre: item.consentName ? item.nombre : undefined,
          importe: item.importe,
          ts: item.ts,
        };
        contributors.push(contributor);
        // mantener solo los últimos 200
        while (contributors.length > 200) {
          contributors.shift();
        }
        await writeJSON(env, 'hzm:contributors', contributors);
        return withCors(env, new Response(JSON.stringify({ ok: true, total, price }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      // /api/admin/reject – descarta una aportación pendiente
      if (pathname === '/api/admin/reject' && request.method === 'POST') {
        const data = await request.json();
        const { id } = data || {};
        if (!id || typeof id !== 'string') {
          return withCors(env, new Response(JSON.stringify({ error: 'id inválido' }), { status: 400, headers: { 'Content-Type': 'application/json' } }));
        }
        const pending = await readJSON<Pending[]>(env, 'hzm:pending', []);
        const idx = pending.findIndex((p) => p.id === id);
        if (idx === -1) {
          return withCors(env, new Response(JSON.stringify({ error: 'no encontrado' }), { status: 404, headers: { 'Content-Type': 'application/json' } }));
        }
        pending.splice(idx, 1);
        await writeJSON(env, 'hzm:pending', pending);
        return withCors(env, new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
    }

    return withCors(env, new Response(JSON.stringify({ error: 'no encontrado' }), { status: 404, headers: { 'Content-Type': 'application/json' } }));
  },
};
