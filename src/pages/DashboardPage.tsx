import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SummaryCard } from '../components/dashboard/SummaryCard';
import { CuentasCobrarTable } from '../components/cuentas/CuentasCobrarTable';
import { Loading } from '../components/ui/Loading';
import { Button } from '../components/ui/Button';
import { ventasService } from '../services/ventasService';
import { cuentasCobrarService } from '../services/cuentasCobrarService';
import { Venta } from '../types/venta';
import { CuentaCobrarDetalle } from '../types/cuentaCobrar';
import { formatCurrency } from '../utils/formatters';
import { LayoutDashboard, Receipt, Coins, CreditCard, ArrowRight } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [cuentas, setCuentas] = useState<CuentaCobrarDetalle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [ventasData, cuentasData] = await Promise.all([
        ventasService.getVentas(),
        cuentasCobrarService.getCuentasCobrar()
      ]);
      setVentas(ventasData);
      setCuentas(cuentasData);
    } catch (e) {
      console.error('Error al obtener datos del dashboard', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCobrarClick = async (cuentaId: number, monto: number) => {
    try {
      await cuentasCobrarService.registrarCobroOffline(cuentaId, monto);
      await fetchDashboardData(); // Recargar datos
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return <Loading message="Cargando panel de control de GQG System..." fullPage />;
  }

  // Agregadores en Guaraníes (PYG) de manera predeterminada para el panel principal
  // (Si hay dólares se convierten a número crudo para el consolidado general académico)
  const totalVentasSum = ventas.reduce((acc, v) => acc + v.total_factura, 0);
  const totalPendienteSum = cuentas
    .filter(c => c.estado.toUpperCase() === 'PENDIENTE')
    .reduce((acc, c) => acc + c.saldo, 0);
  const totalCobradoSum = cuentas.reduce((acc, c) => acc + c.cobrado, 0);
  const totalCuentasPendientesCount = cuentas.filter(c => c.estado.toUpperCase() === 'PENDIENTE').length;

  // Filtrar las próximas 5 cuentas por cobrar que vencen pronto
  const proximasCuentas = cuentas
    .filter(c => c.estado.toUpperCase() === 'PENDIENTE')
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Dashboard Ejecutivo
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Resumen contable y control de cobranzas para GQG System.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="primary"
            onClick={() => navigate('/ventas/nueva')}
            className="flex items-center gap-2"
          >
            <Receipt className="w-4 h-4" />
            <span>Registrar Venta</span>
          </Button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Facturado"
          value={formatCurrency(totalVentasSum, 'PYG')}
          icon={Receipt}
          color="slate"
          description={`De un total de ${ventas.length} ventas`}
        />
        <SummaryCard
          title="Saldo por Cobrar"
          value={formatCurrency(totalPendienteSum, 'PYG')}
          icon={Coins}
          color="amber"
          description={`${totalCuentasPendientesCount} cuotas pendientes`}
        />
        <SummaryCard
          title="Total Cobrado"
          value={formatCurrency(totalCobradoSum, 'PYG')}
          icon={CreditCard}
          color="emerald"
          description="Abonos registrados en sistema"
        />
        <SummaryCard
          title="Eficiencia de Cobro"
          value={`${totalVentasSum > 0 ? Math.round((totalCobradoSum / totalVentasSum) * 100) : 0}%`}
          icon={LayoutDashboard}
          color="blue"
          description="Porcentaje del saldo recuperado"
        />
      </div>

      {/* RECENT ACCOUNTS RECEIVABLE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Coins className="w-5 h-5 text-brand-600" />
            <span>Próximos Vencimientos (Cuentas a Cobrar)</span>
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/cuentas-cobrar')}
            className="text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1"
          >
            <span>Ver todas</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <CuentasCobrarTable
          cuentas={proximasCuentas}
          onCobrarClick={handleCobrarClick}
        />
      </div>
    </div>
  );
};
