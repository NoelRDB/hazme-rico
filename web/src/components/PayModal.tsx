import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { postClaim } from '../lib/api';

interface Props {
  show: boolean;
  price: number;
  onClose: () => void;
  /** Callback llamado cuando la declaración se ha enviado correctamente. */
  onSubmitted?: () => void;
}

/**
 * Modal de declaración de pago. Permite al usuario enviar su nombre (opcional),
 * importe (pre-rellenado), una URL de prueba opcional y el consentimiento
 * para mostrar su nombre públicamente. Tras enviar los datos se muestra un
 * mensaje de confirmación.
 */
const PayModal: React.FC<Props> = ({ show, price, onClose, onSubmitted }) => {
  const [nombre, setNombre] = useState('');
  const [importe, setImporte] = useState(price.toFixed(2));
  const [pruebaURL, setPruebaURL] = useState('');
  const [consentName, setConsentName] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ajusta el importe cuando cambia el precio inicial
  useEffect(() => {
    setImporte(price.toFixed(2));
  }, [price]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const amount = parseFloat(importe);
      await postClaim({
        nombre: nombre.trim() || undefined,
        importe: amount,
        pruebaURL: pruebaURL.trim() || undefined,
        consentName,
      });
      setSuccess(true);
      if (onSubmitted) onSubmitted();
    } catch (err: any) {
      setError(err.message ?? 'Error al enviar');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNombre('');
    setPruebaURL('');
    setConsentName(false);
    setSuccess(false);
    setError(null);
    setImporte(price.toFixed(2));
  };

  const closeModal = () => {
    resetForm();
    onClose();
  };

  const bizumNumber = import.meta.env.VITE_BIZUM_NUMBER as string;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-gray-800 rounded-xl p-6 shadow-xl w-full max-w-md relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-200"
              onClick={closeModal}
            >
              ✕
            </button>
            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-xl font-semibold mb-2">Confirma tu pago</h2>
                <p className="text-sm text-gray-300">
                  Envía {importe} € por Bizum al <strong>{bizumNumber}</strong>. Luego rellena este
                  formulario para que podamos contar tu aportación.
                </p>
                <div>
                  <label className="block text-sm mb-1" htmlFor="nombre">
                    Nombre (opcional)
                  </label>
                  <input
                    id="nombre"
                    type="text"
                    className="w-full rounded-md bg-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    maxLength={40}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" htmlFor="importe">
                    Importe (€)
                  </label>
                  <input
                    id="importe"
                    type="number"
                    className="w-full rounded-md bg-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
                    value={importe}
                    onChange={(e) => setImporte(e.target.value)}
                    step="0.01"
                    min="0.50"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" htmlFor="pruebaURL">
                    Enlace a la captura de Bizum (opcional)
                  </label>
                  <input
                    id="pruebaURL"
                    type="url"
                    placeholder="https://"
                    className="w-full rounded-md bg-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
                    value={pruebaURL}
                    onChange={(e) => setPruebaURL(e.target.value)}
                  />
                </div>
                <div className="flex items-center">
                  <input
                    id="consentName"
                    type="checkbox"
                    className="mr-2 h-4 w-4 text-secondary focus:ring-secondary border-gray-600 rounded"
                    checked={consentName}
                    onChange={(e) => setConsentName(e.target.checked)}
                  />
                  <label htmlFor="consentName" className="text-sm">
                    Consiento que mi nombre aparezca públicamente
                  </label>
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-secondary hover:bg-primary text-white font-semibold py-2 rounded-md transition-colors disabled:opacity-60"
                >
                  {loading ? 'Enviando...' : 'Enviar declaración'}
                </button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <h2 className="text-xl font-semibold">¡Gracias por tu aportación!</h2>
                <p className="text-gray-300">
                  Tu pago quedará visible cuando lo apruebe el administrador.
                </p>
                <button
                  onClick={closeModal}
                  className="mt-2 bg-secondary hover:bg-primary text-white font-semibold py-2 px-4 rounded-md"
                >
                  Cerrar
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PayModal;