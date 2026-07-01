import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ComprasTable } from '../components/compras/ComprasTable';
import { Loading } from '../components/ui/Loading';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { catalogosService } from '../services/catalogosService';
import { comprasService } from '../services/comprasService';
import { Compra } from '../types/compra';
import { Proveedor, Moneda, Plazo, TipoDocumento } from '../types/catalogos';
import { PlusCircle, Search, RefreshCw } from 'lucide-react';

export const ComprasPage: React.FC = () => {
  const navigate = useNavigate();
  const [compras, setCompras] = useState<Compra[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [plazos, setPlazos] = useState<Plazo[]>([]);
  const [tiposDoc, setTiposDoc] = useState<TipoDocumento[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [comprasData, proveedoresData, monedasData, plazosData, tiposDocData] = await Promise.all([
        comprasService.getCompras(),
        catalogosService.getProveedores(),
        catalogosService.getMonedas(),
        catalogosService.getPlazos(),
        catalogosService.getTiposDocumento()
      ]);
      setCompras(comprasData);
      setProveedores(proveedoresData);
      setMonedas(monedasData);
      setPlazos(plazosData);
      setTiposDoc(tiposDocData);
    } catch (e) {
      console.error('Falla al cargar listado de compras', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrar compras por RUC del proveedor, Razón Social o Número de Factura
  const filteredCompras = compras.filter((compra) => {
    const proveedor = proveedores.find(p => p.id === compra.proveedor_id);
    const proveedorName = proveedor?.ruc.toLowerCase() || '';
    const proveedorRuc = proveedor?.ruc || '';
    const nroFacturaStr = String(compra.nro_factura);
    const query = searchQuery.toLowerCase();
    
    return (
      proveedorName.includes(query) ||
      proveedorRuc.includes(query) ||
      nroFacturaStr.includes(query)
    );
  });

  if (isLoading) {
    return <Loading message="Consultando compras registradas en la base de datos..." fullPage />;
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Compras Registradas
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Listado completo de facturas de compra (contado y crédito) ingresadas al GQG System.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={loadData}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refrescar</span>
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/compras/nueva')}
            className="flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Registrar Compra</span>
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4 flex items-center gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por proveedor, RUC o número de factura..."
            className="pl-10"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          />
        </div>
      </Card>

      {/* Grid de Compras */}
      <ComprasTable
        compras={filteredCompras}
        proveedores={proveedores}
        monedas={monedas}
        plazos={plazos}
        tiposDoc={tiposDoc}
      />
    </div>
  );
};
