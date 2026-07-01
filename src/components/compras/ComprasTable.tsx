import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Table } from '../ui/Table';
import { Button } from '../ui/Button';
import { Compra } from '../../types/compra';
import { Proveedor, Moneda, Plazo, TipoDocumento } from '../../types/catalogos';
import { formatCurrency, formatInvoice } from '../../utils/formatters';
import { formatDate } from '../../utils/dates';
import { Eye, ShieldAlert } from 'lucide-react';

interface ComprasTableProps {
  compras: Compra[];
  proveedores: Proveedor[];
  monedas: Moneda[];
  plazos: Plazo[];
  tiposDoc: TipoDocumento[];
  onSelectCompra?: (compra: Compra) => void;
}

export const ComprasTable: React.FC<ComprasTableProps> = ({
  compras,
  proveedores,
  monedas,
  plazos,
  tiposDoc,
  onSelectCompra
}) => {
  const navigate = useNavigate();

  const getProveedorName = (id: number) => {
    return proveedores.find(p => p.id === id)?.ruc || `Proveedor #${id}`;
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

  if (compras.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
        <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-700">Sin Compras Registradas</h3>
        <p className="text-xs text-slate-500 mt-1">Registra tu primera compra para verla listada en esta sección.</p>
        <Button
          variant="primary"
          size="sm"
          className="mt-4"
          onClick={() => navigate('/compras/nueva')}
        >
          Registrar Nueva Compra
        </Button>
      </div>
    );
  }

  const headers = [
    'Documento / Factura',
    'Fecha',
    'Proveedor',
    'Tipo Documento',
    'Plazo Comercial',
    'Importe Total',
    'Acción'
  ];

  return (
    <Table headers={headers}>
      {compras.map((compra) => {
        const currencyAbrev = getMonedaAbrev(compra.moneda_id);
        return (
          <tr key={compra.id} className="hover:bg-slate-50/50 transition-colors">
            {/* Factura & Timbrado */}
            <td className="px-6 py-4">
              <span className="block font-bold text-slate-800 leading-tight">
                {formatInvoice(compra.serie, compra.nro_factura)}
              </span>
              <span className="block text-[10px] font-semibold text-slate-400 mt-0.5">
                Timbrado: {compra.timbrado}
              </span>
            </td>

            {/* Fecha Factura */}
            <td className="px-6 py-4 font-semibold text-slate-700">
              {formatDate(compra.fecha_factura)}
            </td>

            {/* Proveedor */}
            <td className="px-6 py-4 font-medium text-slate-800">
              {getProveedorName(compra.proveedor_id)}
            </td>

            {/* Tipo Documento */}
            <td className="px-6 py-4">
              <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-md ${
                compra.tipo_doc_id === 1 
                  ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
              }`}>
                {getTipoDocName(compra.tipo_doc_id)}
              </span>
            </td>

            {/* Plazo */}
            <td className="px-6 py-4 text-xs font-semibold text-slate-600">
              {getPlazoName(compra.plazo_id)}
            </td>

            {/* Total Factura */}
            <td className="px-6 py-4 font-extrabold text-slate-900 text-right pr-12">
              {formatCurrency(compra.total_factura, currencyAbrev)}
            </td>

            {/* Acciones */}
            <td className="px-6 py-4">
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-1.5"
                  onClick={() => {
                    if (onSelectCompra) {
                      onSelectCompra(compra);
                    } else {
                      navigate(`/cuentas-pagar?compra_id=${compra.id}`);
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
