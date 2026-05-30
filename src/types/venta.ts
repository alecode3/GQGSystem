import { Venta } from './database';

export type { Venta };

export type NuevaVentaPayload = Omit<Venta, 'id' | 'fecha_proceso'>;
