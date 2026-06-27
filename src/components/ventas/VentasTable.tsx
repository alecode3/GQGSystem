import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Table } from '../ui/Table';
import { Button } from '../ui/Button';
import { Venta } from '../../types/venta';
import { Cliente, Moneda, Plazo, TipoDocumento } from '../../types/catalogos';
import { formatCurrency, formatInvoice } from '../../utils/formatters';
import { formatDate } from '../../utils/dates';
import { Eye, ShieldAlert } from 'lucide-react';

interface VentasTableProps {
  ventas: Venta[];
  clientes: Cliente[];
  monedas: Moneda[];
  plazos: Plazo[];
  tiposDoc: TipoDocumento[];
  onSelectVenta?: (venta: Venta) => void;
}

export const VentasTable: React.FC<VentasTableProps> = ({
  ventas,
  clientes,
  monedas,
  plazos,
  tiposDoc,
  onSelectVenta
}) => {
  const navigate = useNavigate();

  const getClienteName = (id: number) => {
    return clientes.find(c => c.id === id)?.razon_social || `Cliente #${id}`;
  };

  const getMonedaAbrev = (id: number) => {
    return monedas.find(m => m.id === id)?.abreviatura || 'PYG';
  };

  const getTipoDocName = (id: number) => {
    return tiposDoc.find(t => t.id === id)?.descripcion || `Tipo #${id}`;
  };

  const getPlazoName = (id: number) => {
    return plazos.find(p => p.id === id)?.plazo || `Plazo #${id}`;
  };

  if (ventas.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
        <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-700">Sin Ventas Registradas</h3>
        <p className="text-xs text-slate-500 mt-1">Registra tu primera venta para verla listada en esta sección.</p>
        <Button
          variant="primary"
          size="sm"
          className="mt-4"
          onClick={() => navigate('/ventas/nueva')}
        >
          Registrar Nueva Venta
        </Button>
      </div>
    );
  }

  const headers = [
    'Documento / Factura',
    'Fecha',
    'Cliente',
    'Tipo Documento',
    'Plazo Comercial',
    'Importe Total',
    'Acción'
  ];

  return (
    <Table headers={headers}>
      {ventas.map((venta) => {
        const currencyAbrev = getMonedaAbrev(venta.moneda_id);
        return (
          <tr key={venta.id} className="hover:bg-slate-50/50 transition-colors">
            {/* Factura & Timbrado */}
            <td className="px-6 py-4">
              <span className="block font-bold text-slate-800 leading-tight">
                {formatInvoice(venta.serie, venta.nro_factura)}
              </span>
              <span className="block text-[10px] font-semibold text-slate-400 mt-0.5">
                Timbrado: {venta.timbrado}
              </span>
            </td>

            {/* Fecha Factura */}
            <td className="px-6 py-4 font-semibold text-slate-700">
              {formatDate(venta.fecha_factura)}
            </td>

            {/* Cliente */}
            <td className="px-6 py-4 font-medium text-slate-800">
              {getClienteName(venta.cliente_id)}
            </td>

            {/* Tipo Documento */}
            <td className="px-6 py-4">
              <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-md ${
                venta.tipo_doc_id === 1 
                  ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
              }`}>
                {getTipoDocName(venta.tipo_doc_id)}
              </span>
            </td>

            {/* Plazo */}
            <td className="px-6 py-4 text-xs font-semibold text-slate-600">
              {getPlazoName(venta.plazo_id)}
            </td>

            {/* Total Factura */}
            <td className="px-6 py-4 font-extrabold text-slate-900 text-right pr-12">
              {formatCurrency(venta.total_factura, currencyAbrev)}
            </td>

            {/* Acciones */}
            <td className="px-6 py-4">
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-1.5"
                  onClick={() => {
                    if (onSelectVenta) {
                      onSelectVenta(venta);
                    } else {
                      navigate(`/cuentas-cobrar?venta_id=${venta.id}`);
                    }
                  }}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver Cuotas</span>
                </Button>
              </div>
            </td>
          </tr>
        );
      })}
    </Table>
  );
};
