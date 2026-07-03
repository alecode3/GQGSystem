import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../ui/Card';
import { Select } from '../ui/Select';
import { Plazo, PlazoDetalle, TipoDocumento } from '../../types/database';
import { catalogosService } from '../../services/catalogosService';
import {
  buildPlanCuotasLabel,
  calcularCuotasPreview,
  CuotaPreviewRow,
  findPlazoContado,
  findTipoByCodigo
} from '../../utils/cuotasPreview';
import { formatCurrency } from '../../utils/formatters';
import { formatDate } from '../../utils/dates';
import { CreditCard, Banknote, Eye } from 'lucide-react';

interface CondicionPagoSectionProps {
  tiposDoc: TipoDocumento[];
  plazos: Plazo[];
  tipoDocId: string;
  plazoId: string;
  onTipoDocChange: (tipoDocId: string, plazoId: string) => void;
  onPlazoChange: (plazoId: string) => void;
  fechaFactura: string;
  totalFactura: number;
  monedaAbrev: string;
}

export const CondicionPagoSection: React.FC<CondicionPagoSectionProps> = ({
  tiposDoc,
  plazos,
  tipoDocId,
  plazoId,
  onTipoDocChange,
  onPlazoChange,
  fechaFactura,
  totalFactura,
  monedaAbrev
}) => {
  const [plazoDetalles, setPlazoDetalles] = useState<PlazoDetalle[]>([]);

  const tipoContado = findTipoByCodigo(tiposDoc, 'CO');
  const tipoCredito = findTipoByCodigo(tiposDoc, 'CR');
  const tipoDocSeleccionado = tiposDoc.find((t) => t.id === Number(tipoDocId));
  const plazoSeleccionado = plazos.find((p) => p.id === Number(plazoId));
  const esCredito = tipoDocSeleccionado?.codigo === 'CR';

  const plazosCredito = plazos.filter((p) => p.tipo_id === tipoCredito?.id);

  useEffect(() => {
    const cargarDetalles = async () => {
      if (!plazoSeleccionado?.irregular || !plazoId) {
        setPlazoDetalles([]);
        return;
      }
      try {
        const detalles = await catalogosService.getPlazoDetalles(Number(plazoId));
        setPlazoDetalles(detalles);
      } catch {
        setPlazoDetalles([]);
      }
    };
    cargarDetalles();
  }, [plazoId, plazoSeleccionado?.irregular]);

  const planCuotasLabel = useMemo(
    () => buildPlanCuotasLabel(plazoSeleccionado, tipoDocSeleccionado, plazoDetalles),
    [plazoSeleccionado, tipoDocSeleccionado, plazoDetalles]
  );

  const cuotasPreview: CuotaPreviewRow[] = useMemo(
    () => calcularCuotasPreview(fechaFactura, totalFactura, tipoDocSeleccionado, plazoSeleccionado, plazoDetalles),
    [fechaFactura, totalFactura, tipoDocSeleccionado, plazoSeleccionado, plazoDetalles]
  );

  const handleCondicionChange = (codigo: 'CO' | 'CR') => {
    const tipo = codigo === 'CO' ? tipoContado : tipoCredito;
    if (!tipo) return;

    if (codigo === 'CO') {
      const plazoContado = findPlazoContado(plazos, tipo.id);
      onTipoDocChange(String(tipo.id), plazoContado ? String(plazoContado.id) : '');
      return;
    }

    onTipoDocChange(String(tipo.id), '');
  };

  const condicionActiva = tipoDocSeleccionado?.codigo as 'CO' | 'CR' | undefined;

  return (
    <Card className="space-y-5">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <CreditCard className="w-5 h-5 text-brand-600" />
        <h2 className="text-base font-bold text-slate-800">
          Condición de Pago
        </h2>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        Seleccione si la operación se realiza al <strong>contado</strong> o a <strong>crédito</strong>.
        En crédito, elija el plan de cuotas; el sistema previsualiza los vencimientos antes de confirmar.
      </p>

      {/* Selector Contado / Crédito */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleCondicionChange('CO')}
          className={`flex items-start gap-3 p-4 rounded-xl border-[3px] text-left transition-all shadow-md ${
            condicionActiva === 'CO'
              ? 'border-brand-500 bg-brand-50 shadow-brand-200/60'
              : 'border-slate-300 bg-white hover:border-slate-400 hover:shadow-lg'
          }`}
        >
          <div className={`p-2 rounded-lg ${condicionActiva === 'CO' ? 'bg-brand-100' : 'bg-slate-100'}`}>
            <Banknote className={`w-5 h-5 ${condicionActiva === 'CO' ? 'text-brand-700' : 'text-slate-500'}`} />
          </div>
          <div>
            <span className="block text-sm font-extrabold text-slate-800">Contado (CO)</span>
            <span className="block text-xs text-slate-500 mt-0.5">
              Una sola cuota, cancelada en la fecha de la factura.
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleCondicionChange('CR')}
          className={`flex items-start gap-3 p-4 rounded-xl border-[3px] text-left transition-all shadow-md ${
            condicionActiva === 'CR'
              ? 'border-indigo-500 bg-indigo-50 shadow-indigo-200/60'
              : 'border-slate-300 bg-white hover:border-slate-400 hover:shadow-lg'
          }`}
        >
          <div className={`p-2 rounded-lg ${condicionActiva === 'CR' ? 'bg-indigo-100' : 'bg-slate-100'}`}>
            <CreditCard className={`w-5 h-5 ${condicionActiva === 'CR' ? 'text-indigo-700' : 'text-slate-500'}`} />
          </div>
          <div>
            <span className="block text-sm font-extrabold text-slate-800">Crédito (CR)</span>
            <span className="block text-xs text-slate-500 mt-0.5">
              Una o más cuotas con vencimiento regular o irregular.
            </span>
          </div>
        </button>
      </div>

      {/* Plan de cuotas — solo para crédito */}
      {esCredito && (
        <Select
          label="Plan de Cuotas"
          value={plazoId}
          onChange={(e) => onPlazoChange(e.target.value)}
          placeholder="Seleccione el plan de financiación..."
          required
          options={plazosCredito.map((p) => ({
            value: p.id,
            label: `${p.plazo} — ${p.irregular ? 'Irregular' : 'Regular'} (${p.cuotas} cuota${p.cuotas > 1 ? 's' : ''})`
          }))}
        />
      )}

      {/* Campo Cuotas + previsualización */}
      {condicionActiva && plazoId && totalFactura > 0 && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-wrap items-center gap-2 p-4 bg-slate-50 border-2 border-slate-300 rounded-xl shadow-md shadow-slate-200/70">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cuotas:</span>
            <span className="text-sm font-extrabold text-slate-800">{planCuotasLabel}</span>
            {plazoSeleccionado && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                plazoSeleccionado.irregular
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {plazoSeleccionado.irregular ? 'Vencimiento Irregular' : 'Vencimiento Regular'}
              </span>
            )}
          </div>

          {cuotasPreview.length > 0 && (
            <div className="gqg-panel overflow-hidden shadow-lg">
              <div className="bg-emerald-100/90 px-4 py-2.5 flex items-center gap-2 border-b-2 border-emerald-300">
                <Eye className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
                  Previsualización del Plan de Pagos
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-emerald-50 text-emerald-900 text-xs font-bold uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Cuota</th>
                      <th className="px-4 py-3 text-right">Importe</th>
                      <th className="px-4 py-3 text-left">Vence</th>
                      <th className="px-4 py-3 text-right">Cobrado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100 bg-white">
                    {cuotasPreview.map((cuota) => (
                      <tr key={cuota.cuota} className="hover:bg-emerald-50/30">
                        <td className="px-4 py-3 font-bold text-slate-700">{cuota.cuota_texto}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-800">
                          {formatCurrency(cuota.importe, monedaAbrev)}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-600">{formatDate(cuota.vence)}</td>
                        <td className="px-4 py-3 text-right text-slate-400 font-semibold">
                          {formatCurrency(cuota.cobrado, monedaAbrev)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {condicionActiva && totalFactura <= 0 && (
        <p className="text-xs text-amber-800 bg-amber-50 border-2 border-amber-300 rounded-lg px-3 py-2 shadow-md shadow-amber-200/50">
          Ingrese los importes de la factura para previsualizar las cuotas.
        </p>
      )}
    </Card>
  );
};
