import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CompraForm } from '../components/compras/CompraForm';
import { Loading } from '../components/ui/Loading';
import { Button } from '../components/ui/Button';
import { catalogosService } from '../services/catalogosService';
import { comprasService } from '../services/comprasService';
import { Proveedor, Moneda, Deposito, TipoDocumento, Plazo } from '../types/catalogos';
import { NuevaCompraPayload } from '../types/compra';
import { ArrowLeft, BookOpen } from 'lucide-react';

export const NuevaCompraPage: React.FC = () => {
  const navigate = useNavigate();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [depositos, setDepositos] = useState<Deposito[]>([]);
  const [tiposDoc, setTiposDoc] = useState<TipoDocumento[]>([]);
  const [plazos, setPlazos] = useState<Plazo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const [proveedoresData, monedasData, depositosData, tiposDocData, plazosData] = await Promise.all([
          catalogosService.getProveedores(),
          catalogosService.getMonedas(),
          catalogosService.getDepositos(),
          catalogosService.getTiposDocumento(),
          catalogosService.getPlazos()
        ]);
        
        // Filtrar activos para evitar combos sucios
        setProveedores(proveedoresData.filter(p => p.activo));
        setMonedas(monedasData.filter(m => m.activo));
        setDepositos(depositosData.filter(d => d.activo));
        setTiposDoc(tiposDocData.filter(t => t.activo));
        setPlazos(plazosData.filter(p => p.activo));
      } catch (e) {
        console.error('Error al cargar catálogos en el formulario', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCatalogs();
  }, []);

  const handleRegisterCompraSubmit = async (payload: NuevaCompraPayload) => {
    // Inserta la compra en Supabase o simulador local
    return await comprasService.createCompra(payload);
  };

  if (isLoading) {
    return <Loading message="Cargando catálogos de facturación (Proveedores, Plazos, etc.)..." fullPage />;
  }

  return (
    <div className="space-y-6">
      {/* Navigation and title */}
      <div className="flex items-center gap-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/compras')}
          className="p-2 border border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Registrar Nueva Compra
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Factura electrónica de compra y división automatizada de cuotas de cuentas a pagar.
          </p>
        </div>
      </div>

      {/* Academic Alert Box */}
      <div className="bg-brand-50 border border-brand-200 p-4 rounded-2xl flex gap-3 text-brand-850 animate-fade-in">
        <BookOpen className="w-5 h-5 text-brand-700 flex-shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-extrabold block">DETERMINACIÓN AUTOMÁTICA DE CUENTAS (TRIGGER ACTIVO)</span>
          <p className="leading-relaxed">
            De acuerdo con el modelo académico de Ingeniería de Software III, al guardar este formulario el frontend inserta **únicamente** en la tabla <code className="bg-brand-100/50 px-1 py-0.5 rounded font-mono font-bold text-brand-900">compras</code>. El trigger de la base de datos PostgreSQL en Supabase procesa de manera inmediata la transacción y genera las cuotas en <code className="bg-brand-100/50 px-1 py-0.5 rounded font-mono font-bold text-brand-900">cuentas_pagar</code> de forma automática, sin intervención manual de cálculos en React.
          </p>
        </div>
      </div>

      {/* Formulario */}
      <CompraForm
        proveedores={proveedores}
        monedas={monedas}
        depositos={depositos}
        tiposDoc={tiposDoc}
        plazos={plazos}
        onSubmit={handleRegisterCompraSubmit}
      />
    </div>
  );
};
