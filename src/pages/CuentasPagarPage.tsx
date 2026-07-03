import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CuentasPagarTable } from '../components/cuentas/CuentasPagarTable';
import { CuentaDetallePanel } from '../components/cuentas/CuentaDetallePanel';
import { Loading } from '../components/ui/Loading';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { cuentasPagarService } from '../services/cuentasPagarService';
import { CuentaPagarDetalle } from '../types/cuentaPagar';
import { Search, RefreshCw, X, Coins } from 'lucide-react';

export const CuentasPagarPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const compraIdParam = searchParams.get('compra_id');

  const [cuentas, setCuentas] = useState<CuentaPagarDetalle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadCuentas = async () => {
    setIsLoading(true);
    try {
      let data = await cuentasPagarService.getCuentasPagar();
      setCuentas(data);
    } catch (e) {
      console.error('Error al cargar cuentas a pagar', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCuentas();
  }, []);

  const handlePagarSubmit = async (cuentaId: number, monto: number) => {
    try {
      await cuentasPagarService.registrarPago(cuentaId, monto);
      await loadCuentas(); // Recargar datos frescos
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearCompraFilter = () => {
    searchParams.delete('compra_id');
    setSearchParams(searchParams);
  };

  // Filtrado final en memoria para búsqueda y dropdowns
  const filteredCuentas = cuentas.filter((cuenta) => {
    // 1. Filtrar por compra_id si existe el parámetro en la URL
    if (compraIdParam && cuenta.compra_id !== Number(compraIdParam)) {
      return false;
    }

    // 2. Filtrar por estado
    if (statusFilter !== 'ALL' && cuenta.estado.toUpperCase() !== statusFilter.toUpperCase()) {
      return false;
    }

    // 3. Filtrar por Razón Social del Proveedor o Nro de Factura
    const providerName = cuenta.proveedor?.toLowerCase() || '';
    const facturaStr = cuenta.factura?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();

    return providerName.includes(query) || facturaStr.includes(query);
  });

  const mostrarDetalleFactura = Boolean(compraIdParam) && filteredCuentas.length > 0;
  const cuentaCabecera = filteredCuentas[0];

  if (isLoading) {
    return <Loading message="Consolidando cuentas a pagar desde la vista SQL..." fullPage />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Control de Cuentas a Pagar
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Gestione y supervise las cuentas a pagar de proveedores.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={loadCuentas}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refrescar Vista</span>
          </Button>
        </div>
      </div>

      {/* Alerta de Filtro de Compra Activo */}
      {compraIdParam && (
        <div className="gqg-alert bg-brand-50 border-brand-300 px-4 py-3 shadow-brand-200/50 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2 text-brand-900 text-xs font-semibold">
            <Coins className="w-4 h-4 text-brand-600" />
            <span>
              Filtrado por factura asociada a la compra ID: <strong className="text-brand-950 font-black">{compraIdParam}</strong>
            </span>
          </div>
          <button
            onClick={handleClearCompraFilter}
            className="p-1 rounded-lg hover:bg-brand-100 text-brand-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Barra de Filtros */}
      <Card className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            label="Búsqueda Rápida"
            placeholder="Buscar por nombre de proveedor o número de factura..."
            className="pl-10"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <Select
            label="Filtrar por Estado"
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'Todos los estados' },
              { value: 'PENDIENTE', label: 'PENDIENTE' },
              { value: 'PAGADO', label: 'PAGADO' }
            ]}
          />
        </div>
      </Card>

      {mostrarDetalleFactura && cuentaCabecera ? (
        <CuentaDetallePanel
          titulo="Cuentas a Pagar"
          entidadLabel="Proveedor"
          entidad={cuentaCabecera.proveedor}
          factura={cuentaCabecera.factura}
          fecha={cuentaCabecera.fecha_factura}
          moneda={cuentaCabecera.moneda}
          cuotasPlan={cuentaCabecera.plazo}
          monedaAbrev={cuentaCabecera.moneda_abreviatura || 'PYG'}
          pagadoLabel="Pagado"
          filas={filteredCuentas.map((c) => ({
            cuota_texto: c.cuota_texto,
            importe: c.importe,
            vence: c.vence,
            pagado: c.pagado
          }))}
        />
      ) : (
        <CuentasPagarTable
          cuentas={filteredCuentas}
          onPagarClick={handlePagarSubmit}
        />
      )}
    </div>
  );
};
