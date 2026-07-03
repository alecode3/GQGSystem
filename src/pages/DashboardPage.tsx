import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SummaryCard } from '../components/dashboard/SummaryCard';
import { VencimientosPreview } from '../components/dashboard/VencimientosPreview';
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

  if (isLoading) {
    return <Loading message="Cargando panel de control consolidado..." fullPage />;
  }

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

  const proximasCuentasCobrar = [...cuentasCobrar]
    .filter(c => c.estado.toUpperCase() === 'PENDIENTE')
    .sort((a, b) => new Date(a.vence).getTime() - new Date(b.vence).getTime())
    .slice(0, 3);

  const proximasCuentasPagar = [...cuentasPagar]
    .filter(c => c.estado.toUpperCase() === 'PENDIENTE')
    .sort((a, b) => new Date(a.vence).getTime() - new Date(b.vence).getTime())
    .slice(0, 3);

  const balanceEstimado = totalVentasSum - totalComprasSum;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            Dashboard Corporativo
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Resumen contable y control de saldos de GQG System.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Facturado (Ventas)"
          value={formatCurrency(totalVentasSum, 'PYG')}
          icon={Receipt}
          color="blue"
          description={`${ventas.length} ventas`}
        />
        <SummaryCard
          title="Total Adquirido (Compras)"
          value={formatCurrency(totalComprasSum, 'PYG')}
          icon={ShoppingBag}
          color="slate"
          description={`${compras.length} compras`}
        />
        <SummaryCard
          title="Cuentas a Cobrar"
          value={formatCurrency(totalCobrarSum, 'PYG')}
          icon={Coins}
          color="amber"
          description={`${totalCobrarCount} cuotas pendientes`}
        />
        <SummaryCard
          title="Cuentas a Pagar"
          value={formatCurrency(totalPagarSum, 'PYG')}
          icon={CreditCard}
          color="red"
          description={`${totalPagarCount} cuotas pendientes`}
        />
      </div>

      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-2 border-slate-700">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            Margen Operativo Estimado
          </span>
          <h3 className={`text-2xl font-black ${balanceEstimado >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(balanceEstimado, 'PYG')}
          </h3>
          <p className="text-xs text-slate-400">Ventas menos compras facturadas.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-600 min-w-[140px]">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Cobrado</span>
            <span className="text-sm font-bold text-emerald-400">{formatCurrency(totalCobradoSum, 'PYG')}</span>
          </div>
          <div className="bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-600 min-w-[140px]">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Pagado</span>
            <span className="text-sm font-bold text-rose-400">{formatCurrency(totalPagadoSum, 'PYG')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b-2 border-slate-300 pb-2">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" />
              <span>Próximos Cobros</span>
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/cuentas-cobrar')}
              className="text-brand-650 font-bold flex items-center gap-1"
            >
              <span>Gestionar</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          <VencimientosPreview
            tipo="cobro"
            emptyLabel="Sin cuotas por cobrar"
            items={proximasCuentasCobrar.map((c) => ({
              id: c.cuenta_id,
              factura: c.factura,
              entidad: c.cliente,
              cuota_texto: c.cuota_texto,
              vence: c.vence,
              saldo: c.saldo,
              estado: c.estado,
              moneda_abreviatura: c.moneda_abreviatura
            }))}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between border-b-2 border-slate-300 pb-2">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-red-500" />
              <span>Próximos Pagos</span>
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/cuentas-pagar')}
              className="text-brand-650 font-bold flex items-center gap-1"
            >
              <span>Gestionar</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          <VencimientosPreview
            tipo="pago"
            emptyLabel="Sin cuotas por pagar"
            items={proximasCuentasPagar.map((c) => ({
              id: c.cuenta_id,
              factura: c.factura,
              entidad: c.proveedor,
              cuota_texto: c.cuota_texto,
              vence: c.vence,
              saldo: c.saldo,
              estado: c.estado,
              moneda_abreviatura: c.moneda_abreviatura
            }))}
          />
        </div>
      </div>
    </div>
  );
};
