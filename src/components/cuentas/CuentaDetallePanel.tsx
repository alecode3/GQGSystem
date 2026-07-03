import React from 'react';
import { formatDate } from '../../utils/dates';
import { getEntidadNombreByRuc } from '../../utils/formatters';

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

  const nombreEntidad = getEntidadNombreByRuc(entidad);
  
  // Normalizar nombre de moneda para que diga "Guaraní" si es Guaraníes
  const nombreMoneda = moneda.toLowerCase().includes('guaran') 
    ? 'Guaraní' 
    : (moneda.toLowerCase().includes('dolar') ? 'Dólar' : moneda);

  const isGuaranies = monedaAbrev.toUpperCase() === 'PYG' || monedaAbrev.toUpperCase() === 'GS';

  return (
    <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-md overflow-x-auto">
      <table className="min-w-[400px] md:min-w-[600px] border-collapse border border-[#c0c0c0] font-sans text-xs md:text-sm">
        <tbody>
          {/* Fila Título Sección */}
          <tr>
            <td 
              colSpan={4} 
              className="border border-[#c0c0c0] px-3 py-2 bg-[#f3f4f6] text-[#1f2937] font-extrabold tracking-wider uppercase"
            >
              {titulo.toUpperCase()}
            </td>
          </tr>
          
          {/* Metadatos en formato celda Excel */}
          <tr>
            <td className="border border-[#c0c0c0] px-3 py-1.5 bg-[#f3f4f6] text-[#374151] font-bold w-1/4">
              {entidadLabel}:
            </td>
            <td colSpan={3} className="border border-[#c0c0c0] px-3 py-1.5 bg-white text-[#111827] font-semibold">
              {nombreEntidad}
            </td>
          </tr>
          <tr>
            <td className="border border-[#c0c0c0] px-3 py-1.5 bg-[#f3f4f6] text-[#374151] font-bold">
              Factura:
            </td>
            <td colSpan={3} className="border border-[#c0c0c0] px-3 py-1.5 bg-white text-[#111827] font-semibold">
              {factura}
            </td>
          </tr>
          <tr>
            <td className="border border-[#c0c0c0] px-3 py-1.5 bg-[#f3f4f6] text-[#374151] font-bold">
              Fecha:
            </td>
            <td colSpan={3} className="border border-[#c0c0c0] px-3 py-1.5 bg-white text-[#111827]">
              {formatDate(fecha)}
            </td>
          </tr>
          <tr>
            <td className="border border-[#c0c0c0] px-3 py-1.5 bg-[#f3f4f6] text-[#374151] font-bold">
              Moneda:
            </td>
            <td colSpan={3} className="border border-[#c0c0c0] px-3 py-1.5 bg-white text-[#111827]">
              {nombreMoneda}
            </td>
          </tr>
          <tr>
            <td className="border border-[#c0c0c0] px-3 py-1.5 bg-[#f3f4f6] text-[#374151] font-bold">
              Cuotas:
            </td>
            <td colSpan={3} className="border border-[#c0c0c0] px-3 py-1.5 bg-white text-brand-700 font-extrabold">
              {cuotasPlan}
            </td>
          </tr>

          {/* Espaciador o Cabecera Verde de Excel */}
          <tr className="bg-[#C6EFCE] text-[#006100] font-bold text-center">
            <td className="border border-[#c0c0c0] px-3 py-2 text-left">
              Cuota
            </td>
            <td className="border border-[#c0c0c0] px-3 py-2 text-right">
              Importe
            </td>
            <td className="border border-[#c0c0c0] px-3 py-2 text-left">
              Vence
            </td>
            <td className="border border-[#c0c0c0] px-3 py-2 text-right">
              {pagadoLabel}
            </td>
          </tr>

          {/* Filas de Cuotas */}
          {filas.map((fila, idx) => {
            const formattedCuota = fila.cuota_texto.startsWith('"') 
              ? fila.cuota_texto 
              : `"${fila.cuota_texto}"`;
            
            const displayImporte = isGuaranies 
              ? Math.round(fila.importe) 
              : fila.importe.toFixed(2);
              
            const displayPagado = isGuaranies 
              ? Math.round(fila.pagado) 
              : fila.pagado.toFixed(2);

            return (
              <tr key={idx} className="bg-white hover:bg-slate-50/50">
                <td className="border border-[#c0c0c0] px-3 py-1.5 text-left font-mono font-medium text-slate-800">
                  {formattedCuota}
                </td>
                <td className="border border-[#c0c0c0] px-3 py-1.5 text-right font-mono text-slate-900">
                  {displayImporte}
                </td>
                <td className="border border-[#c0c0c0] px-3 py-1.5 text-left text-slate-700">
                  {formatDate(fila.vence)}
                </td>
                <td className="border border-[#c0c0c0] px-3 py-1.5 text-right font-mono text-emerald-700">
                  {displayPagado}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

