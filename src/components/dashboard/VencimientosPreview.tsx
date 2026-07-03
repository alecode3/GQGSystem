import React from 'react';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../utils/formatters';
import { formatDate } from '../../utils/dates';
import { Calendar, ShieldAlert } from 'lucide-react';

interface VencimientoItem {
  id: number;
  factura: string;
  entidad: string;
  cuota_texto: string;
  vence: string;
  saldo: number;
  estado: string;
  moneda_abreviatura?: string;
}

interface VencimientosPreviewProps {
  items: VencimientoItem[];
  tipo: 'cobro' | 'pago';
  emptyLabel: string;
}

export const VencimientosPreview: React.FC<VencimientosPreviewProps> = ({
  items,
  tipo,
  emptyLabel
}) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-10 gqg-panel shadow-md">
        <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-600">{emptyLabel}</p>
        <p className="text-xs text-slate-400 mt-1">Vista informativa — gestione cobros y pagos en su módulo correspondiente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const vencido = item.estado.toUpperCase() === 'PENDIENTE' && new Date(item.vence) < new Date();
        const moneda = item.moneda_abreviatura || 'PYG';

        return (
          <div
            key={item.id}
            className={`gqg-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-4 ${
              tipo === 'cobro' ? 'border-l-amber-400' : 'border-l-rose-400'
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-800 text-sm">{item.factura}</span>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  {item.cuota_texto}
                </span>
                <Badge status={item.estado} />
              </div>
              <p className="text-xs text-slate-500 mt-1 truncate">{item.entidad}</p>
              <div className={`flex items-center gap-1.5 mt-1.5 text-xs font-semibold ${
                vencido ? 'text-red-600' : 'text-slate-500'
              }`}>
                <Calendar className="w-3.5 h-3.5" />
                <span>Vence: {formatDate(item.vence)}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                tipo === 'cobro' ? 'text-amber-600' : 'text-rose-600'
              }`}>
                Saldo pendiente
              </span>
              <span className="text-lg font-extrabold text-slate-900">
                {formatCurrency(item.saldo, moneda)}
              </span>
            </div>
          </div>
        );
      })}
      <p className="text-[10px] text-slate-400 text-center font-medium pt-1">
        Vista informativa — use Cuentas a {tipo === 'cobro' ? 'Cobrar' : 'Pagar'} para registrar movimientos.
      </p>
    </div>
  );
};
