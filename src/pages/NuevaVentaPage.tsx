import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { VentaForm } from '../components/ventas/VentaForm';
import { Loading } from '../components/ui/Loading';
import { Button } from '../components/ui/Button';
import { catalogosService } from '../services/catalogosService';
import { ventasService } from '../services/ventasService';
import { Cliente, Moneda, Deposito, TipoDocumento, Plazo } from '../types/catalogos';
import { NuevaVentaPayload } from '../types/venta';
import { ArrowLeft, BookOpen } from 'lucide-react';

export const NuevaVentaPage: React.FC = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [depositos, setDepositos] = useState<Deposito[]>([]);
  const [tiposDoc, setTiposDoc] = useState<TipoDocumento[]>([]);
  const [plazos, setPlazos] = useState<Plazo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const [clientesData, monedasData, depositosData, tiposDocData, plazosData] = await Promise.all([
          catalogosService.getClientes(),
          catalogosService.getMonedas(),
          catalogosService.getDepositos(),
          catalogosService.getTiposDocumento(),
          catalogosService.getPlazos()
        ]);
        
        // Filtrar activos para evitar combos sucios
        setClientes(clientesData.filter(c => c.activo));
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

  const handleRegisterVentaSubmit = async (payload: NuevaVentaPayload) => {
    // Inserta la venta en Supabase o simulador local
    return await ventasService.createVenta(payload);
  };

  if (isLoading) {
    return <Loading message="Cargando catálogos de facturación (Clientes, Plazos, etc.)..." fullPage />;
  }

  return (
    <div className="space-y-6">
      {/* Navigation and title */}
      <div className="flex items-center gap-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/ventas')}
          className="p-2 border border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Registrar Nueva Venta
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Emita la factura y seleccione la condición de pago: Contado o Crédito con plan de cuotas.
          </p>
        </div>
      </div>

      {/* Academic Alert Box */}
      <div className="gqg-alert bg-brand-50 border-brand-300 p-4 shadow-brand-200/50 flex gap-3 text-brand-850 animate-fade-in">
        <BookOpen className="w-5 h-5 text-brand-700 flex-shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-extrabold block">DETERMINACIÓN AUTOMÁTICA DE CUENTAS (TRIGGER ACTIVO)</span>
          <p className="leading-relaxed">
            De acuerdo con el modelo académico de Ingeniería de Software III, al guardar este formulario el frontend inserta **únicamente** en la tabla <code className="bg-brand-100/50 px-1 py-0.5 rounded font-mono font-bold text-brand-900">ventas</code>. El trigger de la base de datos PostgreSQL en Supabase procesa de manera inmediata la transacción y genera las cuotas en <code className="bg-brand-100/50 px-1 py-0.5 rounded font-mono font-bold text-brand-900">cuentas_cobrar</code> de forma automática, sin intervención manual de cálculos en React.
          </p>
        </div>
      </div>

      {/* Formulario */}
      <VentaForm
        clientes={clientes}
        monedas={monedas}
        depositos={depositos}
        tiposDoc={tiposDoc}
        plazos={plazos}
        onSubmit={handleRegisterVentaSubmit}
      />
    </div>
  );
};
