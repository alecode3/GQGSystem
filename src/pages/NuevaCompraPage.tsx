import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CompraForm } from '../components/compras/CompraForm';
import { Loading } from '../components/ui/Loading';
import { Button } from '../components/ui/Button';
import { catalogosService } from '../services/catalogosService';
import { comprasService } from '../services/comprasService';
import { Proveedor, Moneda, TipoDocumento, Plazo } from '../types/catalogos';
import { Producto } from '../types/producto';
import { NuevaCompraPayload } from '../types/compra';
import { ArrowLeft } from 'lucide-react';

export const NuevaCompraPage: React.FC = () => {
  const navigate = useNavigate();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [tiposDoc, setTiposDoc] = useState<TipoDocumento[]>([]);
  const [plazos, setPlazos] = useState<Plazo[]>([]);
  const [siguienteNroFactura, setSiguienteNroFactura] = useState(1025);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const [proveedoresData, monedasData, productosData, tiposDocData, plazosData, nextNro] = await Promise.all([
          catalogosService.getProveedores(),
          catalogosService.getMonedas(),
          catalogosService.getProductos(),
          catalogosService.getTiposDocumento(),
          catalogosService.getPlazos(),
          comprasService.getSiguienteNroFactura('001-001')
        ]);

        setProveedores(proveedoresData.filter(p => p.activo));
        setMonedas(monedasData.filter(m => m.activo));
        setProductos(productosData);
        setTiposDoc(tiposDocData.filter(t => t.activo));
        setPlazos(plazosData.filter(p => p.activo));
        setSiguienteNroFactura(nextNro);
      } catch (e) {
        console.error('Error al cargar catálogos', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCatalogs();
  }, []);

  if (isLoading) {
    return <Loading message="Cargando catálogos de compras..." fullPage />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" size="sm" onClick={() => navigate('/compras')} className="p-2 border border-slate-200">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Registrar Nueva Compra</h2>
          <p className="text-sm text-slate-500 font-medium">
            Agregue productos, el desglose se calcula automáticamente y seleccione Contado o Crédito.
          </p>
        </div>
      </div>

      <CompraForm
        proveedores={proveedores}
        monedas={monedas}
        productos={productos}
        tiposDoc={tiposDoc}
        plazos={plazos}
        siguienteNroFactura={siguienteNroFactura}
        onSubmit={(payload: NuevaCompraPayload) => comprasService.createCompra(payload)}
      />
    </div>
  );
};
