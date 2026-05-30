import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CuentasCobrarTable } from '../components/cuentas/CuentasCobrarTable';
import { Loading } from '../components/ui/Loading';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { cuentasCobrarService } from '../services/cuentasCobrarService';
import { CuentaCobrarDetalle } from '../types/cuentaCobrar';
import { Search, RefreshCw, X, Coins } from 'lucide-react';

export const CuentasCobrarPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const ventaIdParam = searchParams.get('venta_id');

  const [cuentas, setCuentas] = useState<CuentaCobrarDetalle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadCuentas = async () => {
    setIsLoading(true);
    try {
      let data = await cuentasCobrarService.getCuentasCobrar();
      setCuentas(data);
    } catch (e) {
      console.error('Error al cargar cuentas a cobrar', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCuentas();
  }, []);

  const handleCobrarSubmit = async (cuentaId: number, monto: number) => {
    try {
      await cuentasCobrarService.registrarCobroOffline(cuentaId, monto);
      await loadCuentas(); // Recargar datos frescos
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearVentaFilter = () => {
    searchParams.delete('venta_id');
    setSearchParams(searchParams);
  };

  // Filtrado final en memoria para búsqueda y dropdowns
  const filteredCuentas = cuentas.filter((cuenta) => {
    // 1. Filtrar por venta_id si existe el parámetro en la URL
    if (ventaIdParam && cuenta.venta_id !== Number(ventaIdParam)) {
      return false;
    }

    // 2. Filtrar por estado
    if (statusFilter !== 'ALL' && cuenta.estado.toUpperCase() !== statusFilter.toUpperCase()) {
      return false;
    }

    // 3. Filtrar por Razón Social, RUC o Nro de Factura
    const clientName = cuenta.cliente?.toLowerCase() || '';
    const facturaStr = cuenta.factura?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();

    return clientName.includes(query) || facturaStr.includes(query);
  });

  if (isLoading) {
    return <Loading message="Consolidando cuentas a cobrar desde la vista SQL..." fullPage />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Control de Cuentas a Cobrar
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Consulta de la vista detallada <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-700">v_cuentas_cobrar_detalle</code>.
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

      {/* Alerta de Filtro de Venta Activo */}
      {ventaIdParam && (
        <div className="bg-brand-50 border border-brand-200 px-4 py-3 rounded-2xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2 text-brand-900 text-xs font-semibold">
            <Coins className="w-4 h-4 text-brand-600" />
            <span>
              Filtrado por factura asociada a la venta ID: <strong className="text-brand-950 font-black">{ventaIdParam}</strong>
            </span>
          </div>
          <button
            onClick={handleClearVentaFilter}
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
            placeholder="Buscar por nombre de cliente o número de factura..."
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
              { value: 'COBRADO', label: 'COBRADO' }
            ]}
          />
        </div>
      </Card>

      {/* Tabla de Resultados */}
      <CuentasCobrarTable
        cuentas={filteredCuentas}
        onCobrarClick={handleCobrarSubmit}
      />
    </div>
  );
};
