import type { Contributor } from '../types';

// URL base de la API. Se inyecta mediante variable de entorno Vite. Asegúrate
// de definir VITE_API_BASE en tu .env para que este valor exista.
const API_BASE = import.meta.env.VITE_API_BASE as string;

export interface State {
  total: number;
  price: number;
  contributors: Contributor[];
}

/**
 * Recupera el estado actual (total recaudado, precio actual y lista de
 * contribuyentes) desde la API.
 */
export async function fetchState(): Promise<State> {
  const res = await fetch(`${API_BASE}/api/state`, {
    method: 'GET',
  });
  if (!res.ok) {
    throw new Error('No se ha podido obtener el estado');
  }
  return (await res.json()) as State;
}

interface ClaimPayload {
  nombre?: string;
  importe: number;
  pruebaURL?: string;
  consentName: boolean;
}

/**
 * Envía una declaración de pago a la API. El importe debe ser al menos
 * 0,50 €. La API devuelve un objeto con un campo `id` del elemento
 * pendiente creado.
 */
export async function postClaim(payload: ClaimPayload): Promise<{ ok: boolean; id: string }> {
  const res = await fetch(`${API_BASE}/api/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Error al enviar la declaración');
  }
  return (await res.json()) as { ok: boolean; id: string };
}

interface PendingEntry {
  id: string;
  nombre?: string;
  importe: number;
  pruebaURL?: string;
  consentName: boolean;
  ts: number;
}

/** Devuelve las aportaciones pendientes de aprobación. */
export async function fetchPending(adminPass: string): Promise<{ pending: PendingEntry[] }> {
  const res = await fetch(`${API_BASE}/api/admin/pending`, {
    method: 'GET',
    headers: { 'x-admin-pass': adminPass },
  });
  if (!res.ok) {
    throw new Error('No autorizado o error al obtener pendientes');
  }
  return (await res.json()) as { pending: PendingEntry[] };
}

/** Aprueba una aportación pendiente. */
export async function approvePending(id: string, adminPass: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-pass': adminPass },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Error al aprobar');
  }
}

/** Rechaza una aportación pendiente. */
export async function rejectPending(id: string, adminPass: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-pass': adminPass },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Error al rechazar');
  }
}
