import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import Counter from './components/Counter';
import PayButton from './components/PayButton';
import PayModal from './components/PayModal';
import ContributorsTable from './components/ContributorsTable';
import AdminPage from './components/AdminPage';
import { content } from './content';
import { fetchState } from './lib/api';
import type { State } from './lib/api';

/**
 * Componente principal de la aplicación. Determina si mostrar la página
 * principal o el panel de administración según la URL. Gestiona la carga
 * del estado desde la API, muestra los contadores, el botón y la tabla,
 * y controla la apertura del modal de declaración de pago.
 */
const App: React.FC = () => {
  // Si la URL incluye /admin, renderizamos el panel de administración.
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    return <AdminPage />;
  }

  const [state, setState] = useState<State | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const prevTotalRef = useRef<number>(0);

  // Cargar estado inicial y configurar polling
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchState();
        if (mounted) {
          setState(data);
          prevTotalRef.current = data.total;
        }
      } catch {
        // Ignoramos errores de red; se pueden mostrar en UI si se desea
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const interval = setInterval(async () => {
      try {
        const data = await fetchState();
        if (!mounted) return;
        // Dispara confeti si aumentó el total
        if (data.total > prevTotalRef.current) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
        prevTotalRef.current = data.total;
        setState(data);
      } catch {
        /* Ignorar */
      }
    }, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  const handleSubmitted = async () => {
  // Tras enviar una declaración, refrescamos manualmente el estado para
    // reflejar el posible cambio si el administrador aprueba rápidamente.
    try {
      const data = await fetchState();
      setState(data);
    } catch {
      /* ignorar */
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2 text-secondary">{content.title}</h1>
        <p className="text-gray-400 mb-1">{content.subtitle}</p>
        <p className="text-gray-500 text-sm max-w-md mx-auto">{content.mission}</p>
      </header>
      {loading || !state ? (
        <p>Cargando…</p>
      ) : (
        <>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">
            <Counter label="Total recaudado" value={state.total} />
            <Counter label="Precio actual" value={state.price} />
          </div>
          <PayButton price={state.price} onClick={openModal} />
          <PayModal show={showModal} price={state.price} onClose={closeModal} onSubmitted={handleSubmitted} />
          <ContributorsTable contributors={state.contributors} />
          <footer className="mt-6 text-xs text-gray-500 max-w-md text-center">
            <p>{content.legal}</p>
          </footer>
        </>
      )}
    </div>
  );
};

export default App;
