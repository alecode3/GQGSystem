import { Compra } from './database';

export type { Compra };

export type NuevaCompraPayload = Omit<Compra, 'id' | 'fecha_proceso'>;
