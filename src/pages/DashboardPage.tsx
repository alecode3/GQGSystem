import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SummaryCard } from '../components/dashboard/SummaryCard';
import { CuentasCobrarTable } from '../components/cuentas/CuentasCobrarTable';
import { CuentasPagarTable } from '../components/cuentas/CuentasPagarTable';
import { Loading } from '../components/ui/Loading';
import { Button } from '../components/ui/Button';
import { ventasService } from '../services/ventasService';
import { comprasService } from '../services/comprasService';
import { cuentasCobrarService } from '../services/cuentasCobrarService';
import { cuentasPagarService } from '../services/cuentasPagarService';
import { Venta } from '../types/venta';
import { Compra } from '../types/compra';
import { CuentaCobrarDetalle } from '../types/cuentaCobrar';
import { CuentaPagarDetalle } from '../types/cuentaPagar';
import { formatCurrency } from '../utils/formatters';
import { Receipt, Coins, CreditCard, ArrowRight, ShoppingBag } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [cuentasCobrar, setCuentasCobrar] = useState<CuentaCobrarDetalle[]>([]);
  const [cuentasPagar, setCuentasPagar] = useState<CuentaPagarDetalle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [ventasData, comprasData, cobrarData, pagarData] = await Promise.all([
        ventasService.getVentas(),
        comprasService.getCompras(),
        cuentasCobrarService.getCuentasCobrar(),
        cuentasPagarService.getCuentasPagar()
      ]);
      setVentas(ventasData);
      setCompras(comprasData);
      setCuentasCobrar(cobrarData);
      setCuentasPagar(pagarData);
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

  const handlePagarClick = async (cuentaId: number, monto: number) => {
    try {
      await cuentasPagarService.registrarPagoOffline(cuentaId, monto);
      await fetchDashboardData(); // Recargar datos
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return <Loading message="Cargando panel de control consolidado..." fullPage />;
  }

  // Agregadores en Guaraníes (PYG) de manera predeterminada para el panel principal
  const totalVentasSum = ventas.reduce((acc, v) => acc + v.total_factura, 0);
  const totalComprasSum = compras.reduce((acc, c) => acc + c.total_factura, 0);
  
  const totalCobrarSum = cuentasCobrar
    .filter(c => c.estado.toUpperCase() === 'PENDIENTE')
    .reduce((acc, c) => acc + c.saldo, 0);
  const totalPagarSum = cuentasPagar
    .filter(c => c.estado.toUpperCase() === 'PENDIENTE')
    .reduce((acc, c) => acc + c.saldo, 0);

  const totalCobradoSum = cuentasCobrar.reduce((acc, c) => acc + c.cobrado, 0);
  const totalPagadoSum = cuentasPagar.reduce((acc, c) => acc + c.pagado, 0);

  const totalCobrarCount = cuentasCobrar.filter(c => c.estado.toUpperCase() === 'PENDIENTE').length;
  const totalPagarCount = cuentasPagar.filter(c => c.estado.toUpperCase() === 'PENDIENTE').length;

  // Filtrar las próximas 3 cuentas de cada tipo que vencen pronto
  const proximasCuentasCobrar = cuentasCobrar
    .filter(c => c.estado.toUpperCase() === 'PENDIENTE')
    .slice(0, 3);

  const proximasCuentasPagar = cuentasPagar
    .filter(c => c.estado.toUpperCase() === 'PENDIENTE')
    .slice(0, 3);

  // Margen contable estimado
  const balanceEstimado = totalVentasSum - totalComprasSum;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Dashboard Corporativo
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Resumen contable y control de saldos (Cuentas por Cobrar y por Pagar) de GQG System.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate('/compras/nueva')}
            className="flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4 text-brand-650" />
            <span>Registrar Compra</span>
          </Button>
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
          title="Total Facturado (Ventas)"
          value={formatCurrency(totalVentasSum, 'PYG')}
          icon={Receipt}
          color="blue"
          description={`${ventas.length} ventas registradas`}
        />
        <SummaryCard
          title="Total Adquirido (Compras)"
          value={formatCurrency(totalComprasSum, 'PYG')}
          icon={ShoppingBag}
          color="slate"
          description={`${compras.length} compras registradas`}
        />
        <SummaryCard
          title="Cuentas a Cobrar (Saldo)"
          value={formatCurrency(totalCobrarSum, 'PYG')}
          icon={Coins}
          color="amber"
          description={`${totalCobrarCount} cuotas pendientes`}
        />
        <SummaryCard
          title="Cuentas a Pagar (Saldo)"
          value={formatCurrency(totalPagarSum, 'PYG')}
          icon={CreditCard}
          color="red"
          description={`${totalPagarCount} cuotas pendientes`}
        />
      </div>

      {/* BALANCE Y RENDIMIENTO */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Resultado Operativo Neto (Margen Facturado)</span>
          <h3 className={`text-3xl font-black ${balanceEstimado >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(balanceEstimado, 'PYG')}
          </h3>
          <p className="text-xs text-slate-400">Diferencia entre facturación total de ventas y compras.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-800/80 px-5 py-3 rounded-xl border border-slate-700/50">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Flujo Cobrado</span>
            <span className="text-base font-bold text-emerald-400">{formatCurrency(totalCobradoSum, 'PYG')}</span>
          </div>
          <div className="bg-slate-800/80 px-5 py-3 rounded-xl border border-slate-700/50">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Flujo Pagado</span>
            <span className="text-base font-bold text-rose-400">{formatCurrency(totalPagadoSum, 'PYG')}</span>
          </div>
        </div>
      </div>

      {/* DETALLE CRUZADO DE VENCIMIENTOS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Cuentas a Cobrar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" />
              <span>Próximos Cobros (Cuentas a Cobrar)</span>
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/cuentas-cobrar')}
              className="text-brand-650 hover:text-brand-700 font-bold flex items-center gap-1"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <CuentasCobrarTable
            cuentas={proximasCuentasCobrar}
            onCobrarClick={handleCobrarClick}
          />
        </div>

        {/* Cuentas a Pagar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-red-500" />
              <span>Próximos Pagos (Cuentas a Pagar)</span>
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/cuentas-pagar')}
              className="text-brand-650 hover:text-brand-700 font-bold flex items-center gap-1"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <CuentasPagarTable
            cuentas={proximasCuentasPagar}
            onPagarClick={handlePagarClick}
          />
        </div>
      </div>
    </div>
  );
};

