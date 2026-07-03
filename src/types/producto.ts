export type TipoIvaProducto = 'gravado' | 'exento';

export interface Producto {
  id: number;
  codigo: string;
  descripcion: string;
  precio_unitario: number;
  tipo_iva: TipoIvaProducto;
  activo: boolean;
}

export interface LineaProductoVenta {
  id: string;
  producto_id: number;
  cantidad: number;
}
