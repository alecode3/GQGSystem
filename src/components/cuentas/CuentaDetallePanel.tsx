import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import { formatDate } from '../../utils/dates';

export interface CuentaDetalleFila {
  cuota_texto: string;
  importe: number;
  vence: string;
  pagado: number;
}

interface CuentaDetallePanelProps {
  titulo: string;
  entidadLabel: string;
  entidad: string;
  factura: string;
  fecha: string;
  moneda: string;
  cuotasPlan: string;
  filas: CuentaDetalleFila[];
  monedaAbrev: string;
  pagadoLabel?: string;
}

export const CuentaDetallePanel: React.FC<CuentaDetallePanelProps> = ({
  titulo,
  entidadLabel,
  entidad,
  factura,
  fecha,
  moneda,
  cuotasPlan,
  filas,
  monedaAbrev,
  pagadoLabel = 'Cobrado'
}) => {
  if (filas.length === 0) return null;

  return (
    <div className="gqg-panel overflow-hidden shadow-xl shadow-slate-300/70">
      <div className="px-6 py-4 border-b-2 border-slate-300 bg-slate-50">
        <h3 className="text-lg font-extrabold text-slate-800 tracking-tight uppercase">
          {titulo}
        </h3>
      </div>

      {/* Encabezado — datos de la factura */}
      <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 border-b-2 border-slate-200 text-sm">
        <div>
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{entidadLabel}</span>
          <span className="block font-bold text-slate-800 mt-0.5">{entidad}</span>
        </div>
        <div>
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Factura</span>
          <span className="block font-bold text-slate-800 mt-0.5">{factura}</span>
        </div>
        <div>
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha</span>
          <span className="block font-bold text-slate-800 mt-0.5">{formatDate(fecha)}</span>
        </div>
        <div>
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Moneda</span>
          <span className="block font-bold text-slate-800 mt-0.5">{moneda}</span>
        </div>
        <div>
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cuotas</span>
          <span className="block font-extrabold text-brand-700 mt-0.5">{cuotasPlan}</span>
        </div>
      </div>

      {/* Tabla de cuotas */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-emerald-100 text-emerald-900 text-xs font-bold uppercase border-b-2 border-emerald-300">
              <th className="px-6 py-3 text-left">Cuota</th>
              <th className="px-6 py-3 text-right">Importe</th>
              <th className="px-6 py-3 text-left">Vence</th>
              <th className="px-6 py-3 text-right">{pagadoLabel}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filas.map((fila, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50">
                <td className="px-6 py-3.5 font-bold text-slate-700">{fila.cuota_texto}</td>
                <td className="px-6 py-3.5 text-right font-bold text-slate-800">
                  {formatCurrency(fila.importe, monedaAbrev)}
                </td>
                <td className="px-6 py-3.5 font-medium text-slate-600">{formatDate(fila.vence)}</td>
                <td className="px-6 py-3.5 text-right font-semibold text-emerald-600">
                  {formatCurrency(fila.pagado, monedaAbrev)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
