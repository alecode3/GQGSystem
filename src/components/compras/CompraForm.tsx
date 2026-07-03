import React, { useState, useEffect } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ErrorMessage } from '../ui/ErrorMessage';
import { Proveedor, Moneda, TipoDocumento, Plazo } from '../../types/catalogos';
import { Producto, LineaProductoVenta } from '../../types/producto';
import { NuevaCompraPayload } from '../../types/compra';
import { CuentaPagarDetalle } from '../../types/cuentaPagar';
import { cuentasPagarService } from '../../services/cuentasPagarService';
import { formatCurrency, formatInvoice, getEntidadNombreByRuc } from '../../utils/formatters';
import { calcularDesgloseDesdeProductos, IVA_PORCENTAJE_PY } from '../../utils/facturaCalculos';
import { CondicionPagoSection } from '../shared/CondicionPagoSection';
import { CuentaDetallePanel } from '../cuentas/CuentaDetallePanel';
import { ProductosVentaSection } from '../ventas/ProductosVentaSection';
import { Save, PlusCircle, CheckCircle, Calendar, DollarSign, FileText } from 'lucide-react';

interface CompraFormProps {
  proveedores: Proveedor[];
  monedas: Moneda[];
  productos: Producto[];
  tiposDoc: TipoDocumento[];
  plazos: Plazo[];
  siguienteNroFactura?: number;
  onSubmit: (payload: NuevaCompraPayload) => Promise<any>;
}

const lineaInicial = (): LineaProductoVenta => ({
  id: crypto.randomUUID(),
  producto_id: 0,
  cantidad: 1
});

export const CompraForm: React.FC<CompraFormProps> = ({
  proveedores,
  monedas,
  productos,
  tiposDoc,
  plazos,
  siguienteNroFactura = 1025,
  onSubmit
}) => {
  const [fechaFactura, setFechaFactura] = useState(new Date().toISOString().split('T')[0]);
  const [proveedorId, setProveedorId] = useState('');
  const [establecimiento, setEstablecimiento] = useState('001');
  const [puntoExpedicion, setPuntoExpedicion] = useState('001');
  const [nroFactura, setNroFactura] = useState(String(siguienteNroFactura));
  const [timbrado, setTimbrado] = useState('87654321');
  const [timbradoVence, setTimbradoVence] = useState(
    new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
  );
  const [monedaId, setMonedaId] = useState('1');
  const [tipoDocId, setTipoDocId] = useState('');
  const [plazoId, setPlazoId] = useState('');
  const [lineasProducto, setLineasProducto] = useState<LineaProductoVenta[]>([lineaInicial()]);

  const [totalExento, setTotalExento] = useState(0);
  const [totalBase, setTotalBase] = useState(0);
  const [totalImpuesto, setTotalImpuesto] = useState(0);
  const [totalFactura, setTotalFactura] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successCompra, setSuccessCompra] = useState<any | null>(null);
  const [cuotasGeneradas, setCuotasGeneradas] = useState<CuentaPagarDetalle[]>([]);

  const serie = `${establecimiento.padStart(3, '0')}-${puntoExpedicion.padStart(3, '0')}`;
  const nroFacturaNum = parseInt(nroFactura, 10) || 0;
  const facturaPreview = formatInvoice(serie, nroFacturaNum);

  useEffect(() => {
    setNroFactura(String(siguienteNroFactura));
  }, [siguienteNroFactura]);

  useEffect(() => {
    const desglose = calcularDesgloseDesdeProductos(lineasProducto, productos);
    setTotalExento(desglose.total_exento);
    setTotalBase(desglose.total_base);
    setTotalImpuesto(desglose.total_impuesto);
    setTotalFactura(desglose.total_factura);
  }, [lineasProducto, productos]);

  const handleCondicionChange = (nuevoTipoDocId: string, nuevoPlazoId: string) => {
    setTipoDocId(nuevoTipoDocId);
    setPlazoId(nuevoPlazoId);
  };

  const tieneProductosValidos = lineasProducto.some(
    (l) => l.producto_id > 0 && l.cantidad > 0
  );

  const validateForm = (): string | null => {
    if (!proveedorId) return 'Debe seleccionar un proveedor.';
    if (!monedaId) return 'Debe seleccionar una moneda.';
    if (!tipoDocId) return 'Debe seleccionar la condición de pago (Contado o Crédito).';
    if (!plazoId) return 'Debe seleccionar el plan de cuotas.';
    if (!fechaFactura) return 'La fecha de la factura es obligatoria.';
    if (!timbrado.trim()) return 'El número de timbrado es obligatorio.';
    if (!timbradoVence) return 'La fecha de vencimiento del timbrado es obligatoria.';
    if (!nroFactura || nroFacturaNum <= 0) return 'El número de factura debe ser mayor a 0.';
    if (!tieneProductosValidos) return 'Debe agregar al menos un producto a la compra.';
    if (totalFactura <= 0) return 'El total de la factura debe ser mayor a 0.';

    const plazoSel = plazos.find(p => p.id === Number(plazoId));
    if (plazoSel && plazoSel.tipo_id !== Number(tipoDocId)) {
      return 'Regla de Negocio: El plazo seleccionado no es compatible con el tipo de documento.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessCompra(null);
    setCuotasGeneradas([]);

    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setIsLoading(true);
    try {
      const payload: NuevaCompraPayload = {
        fecha_factura: fechaFactura,
        proveedor_id: Number(proveedorId),
        serie,
        nro_factura: nroFacturaNum,
        timbrado: timbrado.trim(),
        timbrado_vence: timbradoVence,
        total_exento: totalExento,
        total_impuesto: totalImpuesto,
        total_base: totalBase,
        total_factura: totalFactura,
        deposito_id: 1,
        moneda_id: Number(monedaId),
        tipo_doc_id: Number(tipoDocId),
        plazo_id: Number(plazoId)
      };

      const compraRegistrada = await onSubmit(payload);
      setSuccessCompra(compraRegistrada);
      const cuotas = await cuentasPagarService.getCuentasByCompraId(compraRegistrada.id);
      setCuotasGeneradas(cuotas);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar la compra.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setProveedorId('');
    setNroFactura(String(nroFacturaNum + 1));
    setTipoDocId('');
    setPlazoId('');
    setLineasProducto([lineaInicial()]);
    setSuccessCompra(null);
    setCuotasGeneradas([]);
    setErrorMsg('');
  };

  const monedaAbrev = monedas.find(m => m.id === Number(monedaId))?.abreviatura || 'PYG';
  const monedaDesc = monedas.find(m => m.id === Number(monedaId))?.descripcion || 'Guaraníes';
  const proveedorRuc = proveedores.find(p => p.id === Number(proveedorId))?.ruc || '';

  return (
    <div className="space-y-6">
      {errorMsg && <ErrorMessage title="Fallo en Validación / Regla de Negocio" message={errorMsg} />}

      {successCompra && (
        <Card className="bg-emerald-50/40 border-2 border-emerald-300 shadow-lg animate-fade-in">
          <div className="flex gap-4">
            <CheckCircle className="w-10 h-10 text-emerald-600 flex-shrink-0" />
            <div className="flex-grow space-y-2">
              <h3 className="text-base font-bold text-emerald-800">¡Compra Registrada Exitosamente!</h3>
              <p className="text-sm text-emerald-700">
                Factura <span className="font-extrabold">{formatInvoice(successCompra.serie, successCompra.nro_factura)}</span> por{' '}
                <span className="font-extrabold">{formatCurrency(successCompra.total_factura, monedaAbrev)}</span>.
              </p>
              {cuotasGeneradas.length > 0 && (
                <div className="mt-4 pt-4 border-t border-emerald-200/60">
                  <CuentaDetallePanel
                    titulo="Cuentas a Pagar"
                    entidadLabel="Proveedor"
                    entidad={cuotasGeneradas[0].proveedor || proveedorRuc}
                    factura={formatInvoice(successCompra.serie, successCompra.nro_factura)}
                    fecha={successCompra.fecha_factura}
                    moneda={cuotasGeneradas[0].moneda || monedaDesc}
                    cuotasPlan={cuotasGeneradas[0].plazo}
                    monedaAbrev={cuotasGeneradas[0].moneda_abreviatura || monedaAbrev}
                    pagadoLabel="Pagado"
                    filas={cuotasGeneradas.map((c) => ({
                      cuota_texto: c.cuota_texto,
                      importe: c.importe,
                      vence: c.vence,
                      pagado: c.pagado
                    }))}
                  />
                </div>
              )}
              <Button variant="primary" size="sm" onClick={handleReset} className="flex items-center gap-1.5 mt-2">
                <PlusCircle className="w-4 h-4" />
                <span>Registrar Otra Compra</span>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {!successCompra && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-slate-300 pb-3">
              <Calendar className="w-5 h-5 text-brand-600" />
              <h2 className="text-base font-bold text-slate-800">Datos de Factura de Compra</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Fecha de Factura" type="date" value={fechaFactura} onChange={(e) => setFechaFactura(e.target.value)} required />
              <Select label="Moneda" value={monedaId} onChange={(e) => setMonedaId(e.target.value)} required
                options={monedas.map(m => ({ value: m.id, label: `${m.descripcion} (${m.abreviatura})` }))} />
            </div>
            <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600" />
                <span className="text-sm font-bold text-slate-700">Numeración (formato Paraguay)</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input label="Establecimiento" maxLength={3} value={establecimiento}
                  onChange={(e) => setEstablecimiento(e.target.value.replace(/\D/g, '').slice(0, 3))} required helperText="3 dígitos" />
                <Input label="Punto de Expedición" maxLength={3} value={puntoExpedicion}
                  onChange={(e) => setPuntoExpedicion(e.target.value.replace(/\D/g, '').slice(0, 3))} required helperText="3 dígitos" />
                <Input label="Número de Factura" type="number" value={nroFactura} onChange={(e) => setNroFactura(e.target.value)} required />
              </div>
              <p className="text-sm font-extrabold text-brand-700 text-center">Vista previa: {facturaPreview}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Número de Timbrado" value={timbrado} onChange={(e) => setTimbrado(e.target.value)} required />
              <Input label="Timbrado Vence" type="date" value={timbradoVence} onChange={(e) => setTimbradoVence(e.target.value)} required />
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-slate-300 pb-3">
              <DollarSign className="w-5 h-5 text-brand-600" />
              <h2 className="text-base font-bold text-slate-800">Proveedor</h2>
            </div>
            <Select label="Seleccionar Proveedor" value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}
              placeholder="Seleccione un proveedor..." required
              options={proveedores.map(p => ({ value: p.id, label: `${getEntidadNombreByRuc(p.ruc)} — RUC ${p.ruc}` }))} />
          </Card>

          <Card>
            <ProductosVentaSection productos={productos} lineas={lineasProducto} monedaAbrev={monedaAbrev} onChange={setLineasProducto} />
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-slate-300 pb-3">
              <DollarSign className="w-5 h-5 text-brand-600" />
              <h2 className="text-base font-bold text-slate-800">Desglose Automático (IVA {IVA_PORCENTAJE_PY}%)</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Exento</span>
                <span className="text-sm font-bold">{formatCurrency(totalExento, monedaAbrev)}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Base</span>
                <span className="text-sm font-bold">{formatCurrency(totalBase, monedaAbrev)}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">IVA</span>
                <span className="text-sm font-bold">{formatCurrency(totalImpuesto, monedaAbrev)}</span>
              </div>
              <div className="p-3 bg-brand-50 border-2 border-brand-200 rounded-lg">
                <span className="text-[10px] font-bold text-brand-600 uppercase block">Total</span>
                <span className="text-lg font-black text-brand-800">{formatCurrency(totalFactura, monedaAbrev)}</span>
              </div>
            </div>
          </Card>

          <CondicionPagoSection tiposDoc={tiposDoc} plazos={plazos} tipoDocId={tipoDocId} plazoId={plazoId}
            onTipoDocChange={handleCondicionChange} onPlazoChange={setPlazoId}
            fechaFactura={fechaFactura} totalFactura={totalFactura} monedaAbrev={monedaAbrev} />

          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="lg" isLoading={isLoading}
              disabled={!tipoDocId || !plazoId || !tieneProductosValidos}
              className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              <span>Registrar Compra</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
