import React from 'react';
import { Card } from '../ui/Card';
import { formatCurrency } from '../../utils/formatters';
import { Users } from 'lucide-react';

export interface ResumenCliente {
  cliente_id: number;
  cliente: string;
  cuotasPendientes: number;
  saldoTotal: number;
  moneda_abreviatura: string;
}

interface ResumenClientesPanelProps {
  resumenes: ResumenCliente[];
  onSelectCliente?: (clienteId: number) => void;
  clienteSeleccionado?: number | null;
}

export const ResumenClientesPanel: React.FC<ResumenClientesPanelProps> = ({
  resumenes,
  onSelectCliente,
  clienteSeleccionado
}) => {
  if (resumenes.length === 0) return null;

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2 border-b-2 border-slate-300 pb-2">
        <Users className="w-5 h-5 text-brand-600" />
        <h3 className="text-sm font-bold text-slate-800">Estado de Cuenta por Cliente (RF-05)</h3>
      </div>
      <p className="text-xs text-slate-500">
        Saldo pendiente consolidado por cliente — JOIN entre ventas y cuentas a cobrar vía vista SQL.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {resumenes.map((r) => {
          const activo = clienteSeleccionado === r.cliente_id;
          return (
            <button
              key={r.cliente_id}
              type="button"
              onClick={() => onSelectCliente?.(r.cliente_id)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                activo
                  ? 'border-brand-400 bg-brand-50 shadow-md'
                  : 'border-slate-200 bg-slate-50/80 hover:border-slate-300'
              }`}
            >
              <span className="text-xs font-bold text-slate-700 block truncate">{r.cliente}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {r.cuotasPendientes} cuota{r.cuotasPendientes !== 1 ? 's' : ''} pendiente{r.cuotasPendientes !== 1 ? 's' : ''}
              </span>
              <span className="text-base font-extrabold text-slate-900 block mt-1">
                {formatCurrency(r.saldoTotal, r.moneda_abreviatura)}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
};
