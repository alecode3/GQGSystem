import React, { useState } from 'react';
import { Table } from '../ui/Table';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CuentaCobrarDetalle } from '../../types/cuentaCobrar';
import { formatCurrency } from '../../utils/formatters';
import { formatDate } from '../../utils/dates';
import { Check, CreditCard, ShieldAlert, X } from 'lucide-react';

interface CuentasCobrarTableProps {
  cuentas: CuentaCobrarDetalle[];
  onCobrarClick?: (cuentaId: number, monto: number) => Promise<void>;
}

export const CuentasCobrarTable: React.FC<CuentasCobrarTableProps> = ({
  cuentas,
  onCobrarClick
}) => {
  const [selectedCuentaId, setSelectedCuentaId] = useState<number | null>(null);
  const [cobroMonto, setCobroMonto] = useState('');
  const [isSubmittingCobro, setIsSubmittingCobro] = useState(false);

  const handleCobroSubmit = async (cuentaId: number, saldoMaximo: number) => {
    const monto = parseFloat(cobroMonto);
    if (isNaN(monto) || monto <= 0) {
      alert('Debe ingresar un monto válido mayor a 0.');
      return;
    }
    
    if (monto > saldoMaximo) {
      alert(`El monto a cobrar no puede superar el saldo pendiente de ${formatCurrency(saldoMaximo, 'PYG')}.`);
      return;
    }

    if (onCobrarClick) {
      setIsSubmittingCobro(true);
      try {
        await onCobrarClick(cuentaId, monto);
        setSelectedCuentaId(null);
        setCobroMonto('');
      } catch (e) {
        console.error(e);
      } finally {
        setIsSubmittingCobro(false);
      }
    }
  };

  if (cuentas.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
        <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-700">Sin Cuentas a Cobrar</h3>
        <p className="text-xs text-slate-500 mt-1">No hay saldos pendientes ni registros que coincidan con los filtros seleccionados.</p>
      </div>
    );
  }

  const headers = [
    'Factura / Venta',
    'Cliente',
    'Cuota',
    'Vencimiento',
    'Importe Cuota',
    'Cobrado',
    'Saldo Pendiente',
    'Estado',
    'Acciones'
  ];

  return (
    <Table headers={headers}>
      {cuentas.map((cuenta) => {
        const isPendiente = cuenta.estado.toUpperCase() === 'PENDIENTE';
        const currencyAbrev = cuenta.moneda_abreviatura || 'PYG';
        const isEditingThis = selectedCuentaId === cuenta.cuenta_id;

        return (
          <tr key={cuenta.cuenta_id} className={`hover:bg-slate-50/50 transition-colors ${
            isEditingThis ? 'bg-brand-50/20' : ''
          }`}>
            {/* Factura */}
            <td className="px-6 py-4">
              <span className="block font-bold text-slate-800 leading-tight">
                {cuenta.factura}
              </span>
              <span className="block text-[10px] font-semibold text-slate-400 mt-0.5">
                Plazo: {cuenta.plazo}
              </span>
            </td>

            {/* Cliente */}
            <td className="px-6 py-4">
              <span className="block font-semibold text-slate-800 leading-tight">
                {cuenta.cliente}
              </span>
            </td>

            {/* Nro Cuota */}
            <td className="px-6 py-4">
              <span className="inline-flex px-2 py-0.5 text-xs font-bold bg-slate-100 text-slate-600 rounded-md">
                {cuenta.cuota_texto}
              </span>
            </td>

            {/* Vence */}
            <td className="px-6 py-4">
              <span className={`font-semibold text-xs ${
                isPendiente && new Date(cuenta.vence).getTime() < new Date().getTime()
                  ? 'text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-100'
                  : 'text-slate-700'
              }`}>
                {formatDate(cuenta.vence)}
              </span>
            </td>

            {/* Importe Cuota */}
            <td className="px-6 py-4 font-bold text-slate-800 text-right pr-6">
              {formatCurrency(cuenta.importe, currencyAbrev)}
            </td>

            {/* Cobrado */}
            <td className="px-6 py-4 font-semibold text-emerald-600 text-right pr-6">
              {formatCurrency(cuenta.cobrado, currencyAbrev)}
            </td>

            {/* Saldo Pendiente */}
            <td className="px-6 py-4 font-extrabold text-slate-900 text-right pr-12">
              {formatCurrency(cuenta.saldo, currencyAbrev)}
            </td>

            {/* Estado */}
            <td className="px-6 py-4">
              <Badge status={cuenta.estado} />
            </td>

            {/* Acciones */}
            <td className="px-6 py-4">
              {isPendiente && onCobrarClick ? (
                isEditingThis ? (
                  <div className="flex items-center gap-2 animate-fade-in">
                    <Input
                      type="number"
                      placeholder="Monto"
                      className="w-24 px-2 py-1 text-xs"
                      value={cobroMonto}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCobroMonto(e.target.value)}
                      max={cuenta.saldo}
                      min={0}
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      className="px-2 py-1"
                      isLoading={isSubmittingCobro}
                      onClick={() => handleCobroSubmit(cuenta.cuenta_id, cuenta.saldo)}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="px-2 py-1"
                      onClick={() => {
                        setSelectedCuentaId(null);
                        setCobroMonto('');
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-200"
                    onClick={() => {
                      setSelectedCuentaId(cuenta.cuenta_id);
                      setCobroMonto(String(cuenta.saldo)); // Rellenar con saldo completo por defecto
                    }}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Cobrar</span>
                  </Button>
                )
              ) : (
                <span className="text-xs font-semibold text-slate-400">-</span>
              )}
            </td>
          </tr>
        );
      })}
    </Table>
  );
};
