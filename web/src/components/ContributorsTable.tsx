import React from 'react';
import type { Contributor } from '../types';

interface Props {
  contributors: Contributor[];
}

/**
 * Muestra una tabla con las últimas contribuciones aprobadas. La tabla se
 * ordena de más reciente a más antigua según la marca temporal (ts). Si
 * el nombre no está definido, se muestra "Anónimo".
 */
const ContributorsTable: React.FC<Props> = ({ contributors }) => {
  const rows = [...contributors].sort((a, b) => b.ts - a.ts);
  const dateFormatter = new Intl.DateTimeFormat('es-ES', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <div className="overflow-y-auto max-h-80 mt-6 shadow-inner rounded-lg border border-gray-800">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 bg-gray-800">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">Nombre</th>
            <th className="px-3 py-2 text-left font-semibold">Importe (€)</th>
            <th className="px-3 py-2 text-left font-semibold">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((contrib) => (
            <tr key={contrib.ts} className="odd:bg-gray-900 even:bg-gray-800 border-b border-gray-700">
              <td className="px-3 py-1 whitespace-nowrap">{contrib.nombre ?? 'Anónimo'}</td>
              <td className="px-3 py-1 whitespace-nowrap">{contrib.importe.toFixed(2)}</td>
              <td className="px-3 py-1 whitespace-nowrap">
                {dateFormatter.format(new Date(contrib.ts))}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} className="px-3 py-4 text-center text-gray-400">
                No hay contribuciones aún.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ContributorsTable;