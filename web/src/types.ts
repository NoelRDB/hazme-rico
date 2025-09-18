/**
 * Tipos compartidos entre componentes y utilidades de la aplicación.
 */

/** Representa a un contribuyente en la tabla pública. La propiedad `nombre`
 * solo existe si el usuario consintió mostrarlo. */
export interface Contributor {
  nombre?: string;
  importe: number;
  ts: number;
}
