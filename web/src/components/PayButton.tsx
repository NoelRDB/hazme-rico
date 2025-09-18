import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  price: number;
  onClick: () => void;
}

/**
 * Botón principal que abre el modal de pago. Usa animaciones de Framer
 * Motion para los efectos de entrada y hover.
 */
const PayButton: React.FC<Props> = ({ price, onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="bg-primary hover:bg-secondary text-white font-semibold py-4 px-8 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-secondary/50 text-lg"
    >
      He pagado {price.toFixed(2)} € por Bizum
    </motion.button>
  );
};

export default PayButton;
