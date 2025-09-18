import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  /** Etiqueta descriptiva (ej. "Total recaudado"). */
  label: string;
  /** Valor numérico que se mostrará con dos decimales y símbolo de euro. */
  value: number;
}

/**
 * Muestra un contador animado con un valor monetario. Cuando el valor
 * cambia, el componente crea un elemento clave diferente para reiniciar
 * las animaciones de Framer Motion.
 */
const Counter: React.FC<Props> = ({ label, value }) => {
  return (
    <div className="text-center mx-4">
      <p className="text-sm uppercase tracking-wide text-gray-400 mb-1">{label}</p>
      <motion.div
        key={value}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="text-4xl font-bold text-secondary"
      >
        {value.toFixed(2)} €
      </motion.div>
    </div>
  );
};

export default Counter;
