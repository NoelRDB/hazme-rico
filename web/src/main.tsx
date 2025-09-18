import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Punto de entrada de la aplicación. Monta el componente raíz en el
// elemento con id "root" dentro de index.html.
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
