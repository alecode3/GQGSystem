import React from 'react';
import { Producto, LineaProductoVenta } from '../../types/producto';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../utils/formatters';
import { calcularSubtotalLinea } from '../../utils/facturaCalculos';
import { Package, Plus, Trash2 } from 'lucide-react';

interface ProductosVentaSectionProps {
  productos: Producto[];
  lineas: LineaProductoVenta[];
  monedaAbrev: string;
  onChange: (lineas: LineaProductoVenta[]) => void;
}

const nuevaLinea = (): LineaProductoVenta => ({
  id: crypto.randomUUID(),
  producto_id: 0,
  cantidad: 1
});

export const ProductosVentaSection: React.FC<ProductosVentaSectionProps> = ({
  productos,
  lineas,
  monedaAbrev,
  onChange
}) => {
  const agregarLinea = () => onChange([...lineas, nuevaLinea()]);

  const eliminarLinea = (id: string) => {
    if (lineas.length <= 1) return;
    onChange(lineas.filter((l) => l.id !== id));
  };

  const actualizarLinea = (id: string, campo: 'producto_id' | 'cantidad', valor: number) => {
    onChange(
      lineas.map((l) => (l.id === id ? { ...l, [campo]: valor } : l))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b-2 border-slate-300 pb-3">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-brand-600" />
          <h2 className="text-base font-bold text-slate-800">
            Productos de la Factura
          </h2>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={agregarLinea}
          className="flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar producto</span>
        </Button>
      </div>

      <p className="text-xs text-slate-500">
        Seleccione productos y cantidades. El desglose (exento, base imponible e IVA 10 %) se calcula automáticamente según normativa paraguaya.
      </p>

      <div className="space-y-3">
        {lineas.map((linea, index) => {
          const productoSel = productos.find((p) => p.id === linea.producto_id);
          const subtotal = productoSel ? calcularSubtotalLinea(productoSel, linea.cantidad) : 0;

          return (
            <div
              key={linea.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-4 bg-slate-50/80 border-2 border-slate-200 rounded-xl"
            >
              <div className="md:col-span-1 text-xs font-bold text-slate-400">
                #{index + 1}
              </div>
              <div className="md:col-span-6">
                <Select
                  label="Producto"
                  value={linea.producto_id || ''}
                  onChange={(e) => actualizarLinea(linea.id, 'producto_id', Number(e.target.value))}
                  placeholder="Seleccione un producto..."
                  required
                  options={productos.map((p) => ({
                    value: p.id,
                    label: `${p.codigo} — ${p.descripcion} (${formatCurrency(p.precio_unitario, monedaAbrev)}${p.tipo_iva === 'exento' ? ', Exento' : ', Gravado'})`
                  }))}
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Cantidad"
                  type="number"
                  min={1}
                  value={linea.cantidad}
                  onChange={(e) => actualizarLinea(linea.id, 'cantidad', Math.max(1, parseInt(e.target.value) || 1))}
                  required
                />
              </div>
              <div className="md:col-span-2 text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Subtotal
                </span>
                <span className="text-sm font-extrabold text-slate-800">
                  {formatCurrency(subtotal, monedaAbrev)}
                </span>
              </div>
              <div className="md:col-span-1 flex justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => eliminarLinea(linea.id)}
                  disabled={lineas.length <= 1}
                  className="px-2 py-2 text-red-600 hover:bg-red-50"
                  title="Eliminar línea"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
