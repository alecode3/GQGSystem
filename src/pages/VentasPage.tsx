import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { VentasTable } from '../components/ventas/VentasTable';
import { Loading } from '../components/ui/Loading';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { catalogosService } from '../services/catalogosService';
import { ventasService } from '../services/ventasService';
import { Venta } from '../types/venta';
import { Cliente, Moneda, Plazo, TipoDocumento } from '../types/catalogos';
import { PlusCircle, Search, RefreshCw } from 'lucide-react';

export const VentasPage: React.FC = () => {
  const navigate = useNavigate();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [plazos, setPlazos] = useState<Plazo[]>([]);
  const [tiposDoc, setTiposDoc] = useState<TipoDocumento[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ventasData, clientesData, monedasData, plazosData, tiposDocData] = await Promise.all([
        ventasService.getVentas(),
        catalogosService.getClientes(),
        catalogosService.getMonedas(),
        catalogosService.getPlazos(),
        catalogosService.getTiposDocumento()
      ]);
      setVentas(ventasData);
      setClientes(clientesData);
      setMonedas(monedasData);
      setPlazos(plazosData);
      setTiposDoc(tiposDocData);
    } catch (e) {
      console.error('Falla al cargar listado de ventas', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrar ventas por RUC del cliente, Razón Social o Número de Factura
  const filteredVentas = ventas.filter((venta) => {
    const cliente = clientes.find(c => c.id === venta.cliente_id);
    const clienteName = cliente?.razon_social.toLowerCase() || '';
    const clienteRuc = cliente?.ruc || '';
    const nroFacturaStr = String(venta.nro_factura);
    const query = searchQuery.toLowerCase();
    
    return (
      clienteName.includes(query) ||
      clienteRuc.includes(query) ||
      nroFacturaStr.includes(query)
    );
  });

  if (isLoading) {
    return <Loading message="Consultando ventas registradas en la base de datos..." fullPage />;
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Ventas Registradas
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Listado completo de facturas de contado y crédito emitidas por GQG System.
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
            onClick={() => navigate('/ventas/nueva')}
            className="flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Registrar Factura</span>
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4 flex items-center gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por cliente, RUC o número de factura..."
            className="pl-10"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          />
        </div>
      </Card>

      {/* Grid de Ventas */}
      <VentasTable
        ventas={filteredVentas}
        clientes={clientes}
        monedas={monedas}
        plazos={plazos}
        tiposDoc={tiposDoc}
      />
    </div>
  );
};
