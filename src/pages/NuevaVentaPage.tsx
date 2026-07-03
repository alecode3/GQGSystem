import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { VentaForm } from '../components/ventas/VentaForm';
import { Loading } from '../components/ui/Loading';
import { Button } from '../components/ui/Button';
import { catalogosService } from '../services/catalogosService';
import { ventasService } from '../services/ventasService';
import { Cliente, Moneda, TipoDocumento, Plazo } from '../types/catalogos';
import { Producto } from '../types/producto';
import { NuevaVentaPayload } from '../types/venta';
import { ArrowLeft } from 'lucide-react';

export const NuevaVentaPage: React.FC = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [tiposDoc, setTiposDoc] = useState<TipoDocumento[]>([]);
  const [plazos, setPlazos] = useState<Plazo[]>([]);
  const [siguienteNroFactura, setSiguienteNroFactura] = useState(44686);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const [clientesData, monedasData, productosData, tiposDocData, plazosData, nextNro] = await Promise.all([
          catalogosService.getClientes(),
          catalogosService.getMonedas(),
          catalogosService.getProductos(),
          catalogosService.getTiposDocumento(),
          catalogosService.getPlazos(),
          ventasService.getSiguienteNroFactura('001-001')
        ]);

        setClientes(clientesData.filter(c => c.activo));
        setMonedas(monedasData.filter(m => m.activo));
        setProductos(productosData);
        setTiposDoc(tiposDocData.filter(t => t.activo));
        setPlazos(plazosData.filter(p => p.activo));
        setSiguienteNroFactura(nextNro);
      } catch (e) {
        console.error('Error al cargar catálogos en el formulario', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCatalogs();
  }, []);

  const handleRegisterVentaSubmit = async (payload: NuevaVentaPayload) => {
    return await ventasService.createVenta(payload);
  };

  if (isLoading) {
    return <Loading message="Cargando catálogos de facturación..." fullPage />;
  }

  return (
    <div className="space-y-6">
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
            Agregue productos, el desglose se calcula automáticamente y seleccione Contado o Crédito.
          </p>
        </div>
      </div>

      <VentaForm
        clientes={clientes}
        monedas={monedas}
        productos={productos}
        tiposDoc={tiposDoc}
        plazos={plazos}
        siguienteNroFactura={siguienteNroFactura}
        onSubmit={handleRegisterVentaSubmit}
      />
    </div>
  );
};
