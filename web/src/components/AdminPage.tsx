import React, { useEffect, useState } from 'react';
import {
  fetchPending,
  approvePending,
  rejectPending,
  fetchState,
} from '../lib/api';
import type { State } from '../lib/api';

interface PendingEntry {
  id: string;
  nombre?: string;
  importe: number;
  pruebaURL?: string;
  consentName: boolean;
  ts: number;
}

/** Página de administración accesible desde `/admin`. Solicita la contraseña
 * mediante un formulario simple. Una vez autenticado, muestra las
 * aportaciones pendientes de aprobar y permite aprobarlas o rechazarlas.
 */
const AdminPage: React.FC = () => {
  const [adminPass, setAdminPass] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingEntry[]>([]);
  const [state, setState] = useState<State | null>(null);
  const [loading, setLoading] = useState(false);

  // Carga la contraseña almacenada en la sesión al montar.
  useEffect(() => {
    const stored = sessionStorage.getItem('adminPass');
    if (stored) {
      setAdminPass(stored);
    }
  }, []);

  // Cuando hay contraseña, obtiene el estado y pendientes.
  useEffect(() => {
    if (!adminPass) return;
    setLoading(true);
    Promise.all([
      fetchPending(adminPass).catch(() => {
        setAuthError('Contraseña incorrecta');
        setAdminPass(null);
        sessionStorage.removeItem('adminPass');
        return { pending: [] } as { pending: PendingEntry[] };
      }),
      fetchState(),
    ])
      .then(([pendingRes, stateRes]) => {
        setPending(pendingRes.pending);
        setState(stateRes);
      })
      .finally(() => setLoading(false));
  }, [adminPass]);

  const handleLogin = () => {
    if (!passwordInput) return;
    sessionStorage.setItem('adminPass', passwordInput);
    setAdminPass(passwordInput);
    setPasswordInput('');
    setAuthError(null);
  };

  const refreshLists = () => {
    if (!adminPass) return;
    Promise.all([fetchPending(adminPass), fetchState()])
      .then(([pendingRes, stateRes]) => {
        setPending(pendingRes.pending);
        setState(stateRes);
      })
      .catch(() => {
        setAuthError('Error al refrescar');
      });
  };

  const handleApprove = async (id: string) => {
    if (!adminPass) return;
    await approvePending(id, adminPass);
    refreshLists();
  };

  const handleReject = async (id: string) => {
    if (!adminPass) return;
    await rejectPending(id, adminPass);
    refreshLists();
  };

  const logout = () => {
    sessionStorage.removeItem('adminPass');
    setAdminPass(null);
    setPending([]);
    setState(null);
  };

  if (!adminPass) {
    return (
      <div className="max-w-md mx-auto mt-20 bg-gray-800 p-6 rounded-lg shadow-lg">
        <h1 className="text-xl font-semibold mb-4">Panel de administración</h1>
        <p className="mb-4 text-gray-300">Introduce la contraseña de administrador:</p>
        <input
          type="password"
          className="w-full mb-4 rounded-md bg-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
        />
        {authError && <p className="text-red-400 mb-2">{authError}</p>}
        <button
          onClick={handleLogin}
          className="w-full bg-secondary hover:bg-primary text-white font-semibold py-2 rounded-md"
        >
          Entrar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Panel de administración</h1>
        <button onClick={logout} className="text-sm text-red-400 hover:text-red-300">
          Cerrar sesión
        </button>
      </div>
      {state && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <p className="text-gray-400 text-sm">Total recaudado</p>
            <p className="text-2xl font-bold text-secondary">{state.total.toFixed(2)} €</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <p className="text-gray-400 text-sm">Precio actual</p>
            <p className="text-2xl font-bold text-secondary">{state.price.toFixed(2)} €</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <p className="text-gray-400 text-sm">Contribuciones aprobadas</p>
            <p className="text-2xl font-bold text-secondary">{state.contributors.length}</p>
          </div>
        </div>
      )}
      <h2 className="text-xl font-semibold mb-3">Pendientes de aprobación</h2>
      {loading ? (
        <p>Cargando…</p>
      ) : pending.length === 0 ? (
        <p className="text-gray-400">No hay aportaciones pendientes.</p>
      ) : (
        <div className="overflow-x-auto bg-gray-800 rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-left">Importe (€)</th>
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-left">Prueba</th>
                <th className="px-3 py-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((p) => (
                <tr key={p.id} className="odd:bg-gray-900 even:bg-gray-800 border-b border-gray-700">
                  <td className="px-3 py-1">{p.nombre ?? '—'}</td>
                  <td className="px-3 py-1">{p.importe.toFixed(2)}</td>
                  <td className="px-3 py-1">
                    {new Date(p.ts).toLocaleString('es-ES', {
                      year: '2-digit',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                    <td className="px-3 py-1">
                    {p.pruebaURL ? (
                      <a
                        href={p.pruebaURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 underline"
                      >
                        Ver
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 py-1 space-x-2">
                    <button
                      onClick={() => handleApprove(p.id)}
                      className="bg-green-600 hover:bg-green-500 text-white py-1 px-3 rounded-md text-xs"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleReject(p.id)}
                      className="bg-red-600 hover:bg-red-500 text-white py-1 px-3 rounded-md text-xs"
                    >
                      Rechazar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPage;