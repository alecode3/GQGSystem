import { Producto, LineaProductoVenta } from '../types/producto';

/** IVA general en Paraguay (10 % sobre base imponible). */
export const IVA_PORCENTAJE_PY = 10;

export interface DesgloseFactura {
  total_exento: number;
  total_base: number;
  total_impuesto: number;
  total_factura: number;
}

export const calcularSubtotalLinea = (producto: Producto, cantidad: number): number => {
  return Math.round(producto.precio_unitario * cantidad);
};

export const calcularDesgloseDesdeProductos = (
  lineas: LineaProductoVenta[],
  productos: Producto[]
): DesgloseFactura => {
  let total_exento = 0;
  let total_base = 0;

  for (const linea of lineas) {
    const producto = productos.find((p) => p.id === linea.producto_id);
    if (!producto || linea.cantidad <= 0) continue;

    const subtotal = calcularSubtotalLinea(producto, linea.cantidad);
    if (producto.tipo_iva === 'exento') {
      total_exento += subtotal;
    } else {
      total_base += subtotal;
    }
  }

  const total_impuesto = Math.round(total_base * (IVA_PORCENTAJE_PY / 100));
  const total_factura = total_exento + total_base + total_impuesto;

  return { total_exento, total_base, total_impuesto, total_factura };
};
