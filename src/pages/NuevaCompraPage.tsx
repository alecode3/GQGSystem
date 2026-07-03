import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CompraForm } from '../components/compras/CompraForm';
import { Loading } from '../components/ui/Loading';
import { Button } from '../components/ui/Button';
import { catalogosService } from '../services/catalogosService';
import { comprasService } from '../services/comprasService';
import { Proveedor, Moneda, Deposito, TipoDocumento, Plazo } from '../types/catalogos';
import { NuevaCompraPayload } from '../types/compra';
import { ArrowLeft } from 'lucide-react';

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
            Registre la compra y seleccione la condición de pago: Contado o Crédito con plan de cuotas.
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
