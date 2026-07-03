import React, { useState, useEffect } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ErrorMessage } from '../ui/ErrorMessage';
import { Cliente, Moneda, TipoDocumento, Plazo } from '../../types/catalogos';
import { Producto, LineaProductoVenta } from '../../types/producto';
import { NuevaVentaPayload } from '../../types/venta';
import { CuentaCobrarDetalle } from '../../types/cuentaCobrar';
import { cuentasCobrarService } from '../../services/cuentasCobrarService';
import { formatCurrency, formatInvoice, getClienteNombreByRuc } from '../../utils/formatters';
import { calcularDesgloseDesdeProductos, IVA_PORCENTAJE_PY } from '../../utils/facturaCalculos';
import { CondicionPagoSection } from '../shared/CondicionPagoSection';
import { CuentaDetallePanel } from '../cuentas/CuentaDetallePanel';
import { ProductosVentaSection } from './ProductosVentaSection';
import { Save, PlusCircle, CheckCircle, Calendar, DollarSign, Printer, FileText } from 'lucide-react';
import { printInvoice } from '../../utils/invoicePrinter';

interface VentaFormProps {
  clientes: Cliente[];
  monedas: Moneda[];
  productos: Producto[];
  tiposDoc: TipoDocumento[];
  plazos: Plazo[];
  siguienteNroFactura?: number;
  onSubmit: (payload: NuevaVentaPayload) => Promise<any>;
}

const lineaInicial = (): LineaProductoVenta => ({
  id: crypto.randomUUID(),
  producto_id: 0,
  cantidad: 1
});

export const VentaForm: React.FC<VentaFormProps> = ({
  clientes,
  monedas,
  productos,
  tiposDoc,
  plazos,
  siguienteNroFactura = 44686,
  onSubmit
}) => {
  const [fechaFactura, setFechaFactura] = useState(new Date().toISOString().split('T')[0]);
  const [clienteId, setClienteId] = useState('');
  const [establecimiento, setEstablecimiento] = useState('001');
  const [puntoExpedicion, setPuntoExpedicion] = useState('001');
  const [nroFactura, setNroFactura] = useState(String(siguienteNroFactura));
  const [timbrado, setTimbrado] = useState('12345678');
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
  const [successVenta, setSuccessVenta] = useState<any | null>(null);
  const [cuotasGeneradas, setCuotasGeneradas] = useState<CuentaCobrarDetalle[]>([]);

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

  const handlePlazoChange = (nuevoPlazoId: string) => {
    setPlazoId(nuevoPlazoId);
  };

  const tieneProductosValidos = lineasProducto.some(
    (l) => l.producto_id > 0 && l.cantidad > 0
  );

  const validateForm = (): string | null => {
    if (!clienteId) return 'Debe seleccionar un cliente.';
    if (!monedaId) return 'Debe seleccionar una moneda.';
    if (!tipoDocId) return 'Debe seleccionar la condición de pago (Contado o Crédito).';
    if (!plazoId) return 'Debe seleccionar el plan de cuotas.';
    if (!fechaFactura) return 'La fecha de la factura es obligatoria.';
    if (!timbrado.trim()) return 'El número de timbrado es obligatorio.';
    if (!timbradoVence) return 'La fecha de vencimiento del timbrado es obligatoria.';
    if (!establecimiento.trim() || !puntoExpedicion.trim()) return 'Establecimiento y punto de expedición son obligatorios.';
    if (!nroFactura || nroFacturaNum <= 0) return 'El número de factura debe ser mayor a 0.';
    if (!tieneProductosValidos) return 'Debe agregar al menos un producto a la factura.';
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
    setSuccessVenta(null);
    setCuotasGeneradas([]);

    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setIsLoading(true);
    try {
      const payload: NuevaVentaPayload = {
        fecha_factura: fechaFactura,
        cliente_id: Number(clienteId),
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

      const ventaRegistrada = await onSubmit(payload);
      setSuccessVenta(ventaRegistrada);

      const cuotas = await cuentasCobrarService.getCuentasByVentaId(ventaRegistrada.id);
      setCuotasGeneradas(cuotas);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar la venta. Verifique la compatibilidad de plazos en la base de datos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setClienteId('');
    setNroFactura(String(nroFacturaNum + 1));
    setTipoDocId('');
    setPlazoId('');
    setLineasProducto([lineaInicial()]);
    setSuccessVenta(null);
    setCuotasGeneradas([]);
    setErrorMsg('');
  };

  const monedaAbrev = monedas.find(m => m.id === Number(monedaId))?.abreviatura || 'PYG';
  const monedaDesc = monedas.find(m => m.id === Number(monedaId))?.descripcion || 'Guaraníes';
  const clienteRuc = clientes.find(c => c.id === Number(clienteId))?.ruc || '';

  return (
    <div className="space-y-6">
      {errorMsg && (
        <ErrorMessage
          title="Fallo en Validación / Regla de Negocio"
          message={errorMsg}
        />
      )}

      {successVenta && (
        <Card className="bg-emerald-50/40 border-2 border-emerald-300 shadow-lg animate-fade-in">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-grow space-y-2">
              <h3 className="text-base font-bold text-emerald-800">
                ¡Venta Registrada Exitosamente!
              </h3>
              <p className="text-sm text-emerald-700">
                Factura <span className="font-extrabold">{formatInvoice(successVenta.serie, successVenta.nro_factura)}</span> por{' '}
                <span className="font-extrabold">{formatCurrency(successVenta.total_factura, monedaAbrev)}</span>.
              </p>

              {cuotasGeneradas.length > 0 && (
                <div className="mt-4 pt-4 border-t border-emerald-200/60">
                  <CuentaDetallePanel
                    titulo="Cuentas a Cobrar"
                    entidadLabel="Cliente"
                    entidad={cuotasGeneradas[0].cliente || clienteRuc}
                    factura={formatInvoice(successVenta.serie, successVenta.nro_factura)}
                    fecha={successVenta.fecha_factura}
                    moneda={cuotasGeneradas[0].moneda || monedaDesc}
                    cuotasPlan={cuotasGeneradas[0].plazo}
                    monedaAbrev={cuotasGeneradas[0].moneda_abreviatura || monedaAbrev}
                    filas={cuotasGeneradas.map((c) => ({
                      cuota_texto: c.cuota_texto,
                      importe: c.importe,
                      vence: c.vence,
                      pagado: c.cobrado
                    }))}
                  />
                </div>
              )}

              <div className="pt-2 flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const pSel = plazos.find(p => p.id === successVenta.plazo_id);
                    const mSel = monedas.find(m => m.id === successVenta.moneda_id);
                    const tSel = tiposDoc.find(t => t.id === successVenta.tipo_doc_id);
                    const cSel = clientes.find(c => c.id === successVenta.cliente_id);

                    printInvoice(successVenta, {
                      clienteRuc: cSel?.ruc,
                      clienteDireccion: cSel?.direccion,
                      clienteTelefono: cSel?.telefono,
                      monedaDesc: mSel?.descripcion,
                      monedaAbrev: mSel?.abreviatura,
                      depositoDesc: 'Depósito Central (Asunción)',
                      tipoDocDesc: tSel?.descripcion,
                      plazoDesc: pSel?.plazo
                    });
                  }}
                  className="flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-emerald-600" />
                  <span>Imprimir Factura</span>
                </Button>
                <Button variant="primary" size="sm" onClick={handleReset} className="flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4" />
                  <span>Registrar Otra Venta</span>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {!successVenta && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECCIÓN 1: DATOS DE FACTURA */}
          <Card className="space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-slate-300 pb-3">
              <Calendar className="w-5 h-5 text-brand-600" />
              <h2 className="text-base font-bold text-slate-800">Datos de Factura</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Fecha de Factura"
                type="date"
                value={fechaFactura}
                onChange={(e) => setFechaFactura(e.target.value)}
                required
              />
              <Select
                label="Moneda"
                value={monedaId}
                onChange={(e) => setMonedaId(e.target.value)}
                required
                options={monedas.map(m => ({ value: m.id, label: `${m.descripcion} (${m.abreviatura})` }))}
              />
            </div>

            <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600" />
                <span className="text-sm font-bold text-slate-700">Numeración (formato Paraguay)</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Establecimiento"
                  placeholder="001"
                  maxLength={3}
                  value={establecimiento}
                  onChange={(e) => setEstablecimiento(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  required
                  helperText="3 dígitos"
                />
                <Input
                  label="Punto de Expedición"
                  placeholder="001"
                  maxLength={3}
                  value={puntoExpedicion}
                  onChange={(e) => setPuntoExpedicion(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  required
                  helperText="3 dígitos"
                />
                <Input
                  label="Número de Factura"
                  type="number"
                  placeholder="44686"
                  value={nroFactura}
                  onChange={(e) => setNroFactura(e.target.value)}
                  required
                  helperText="Correlativo"
                />
              </div>
              <p className="text-sm font-extrabold text-brand-700 text-center py-1">
                Vista previa: {facturaPreview}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Número de Timbrado"
                placeholder="12345678"
                value={timbrado}
                onChange={(e) => setTimbrado(e.target.value)}
                required
              />
              <Input
                label="Timbrado Vence"
                type="date"
                value={timbradoVence}
                onChange={(e) => setTimbradoVence(e.target.value)}
                required
              />
            </div>
          </Card>

          {/* SECCIÓN 2: CLIENTE */}
          <Card className="space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-slate-300 pb-3">
              <DollarSign className="w-5 h-5 text-brand-600" />
              <h2 className="text-base font-bold text-slate-800">Cliente</h2>
            </div>
            <Select
              label="Seleccionar Cliente"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              placeholder="Seleccione un cliente..."
              required
              options={clientes.map(c => ({ value: c.id, label: `${getClienteNombreByRuc(c.ruc)} — RUC ${c.ruc}` }))}
            />
          </Card>

          {/* SECCIÓN 3: PRODUCTOS */}
          <Card>
            <ProductosVentaSection
              productos={productos}
              lineas={lineasProducto}
              monedaAbrev={monedaAbrev}
              onChange={setLineasProducto}
            />
          </Card>

          {/* SECCIÓN 4: DESGLOSE AUTOMÁTICO */}
          <Card className="space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-slate-300 pb-3">
              <DollarSign className="w-5 h-5 text-brand-600" />
              <h2 className="text-base font-bold text-slate-800">Desglose Automático (IVA {IVA_PORCENTAJE_PY}%)</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Exento</span>
                <span className="text-sm font-bold text-slate-800">{formatCurrency(totalExento, monedaAbrev)}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Base Imponible</span>
                <span className="text-sm font-bold text-slate-800">{formatCurrency(totalBase, monedaAbrev)}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">IVA {IVA_PORCENTAJE_PY}%</span>
                <span className="text-sm font-bold text-slate-800">{formatCurrency(totalImpuesto, monedaAbrev)}</span>
              </div>
              <div className="p-3 bg-brand-50 border-2 border-brand-200 rounded-lg">
                <span className="text-[10px] font-bold text-brand-600 uppercase block">Total Factura</span>
                <span className="text-lg font-black text-brand-800">{formatCurrency(totalFactura, monedaAbrev)}</span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Calculado desde los productos seleccionados. Productos gravados: base + IVA. Productos exentos: sin IVA.
            </p>
          </Card>

          {/* SECCIÓN 5: CONDICIÓN DE PAGO */}
          <CondicionPagoSection
            tiposDoc={tiposDoc}
            plazos={plazos}
            tipoDocId={tipoDocId}
            plazoId={plazoId}
            onTipoDocChange={handleCondicionChange}
            onPlazoChange={handlePlazoChange}
            fechaFactura={fechaFactura}
            totalFactura={totalFactura}
            monedaAbrev={monedaAbrev}
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              disabled={!tipoDocId || !plazoId || !tieneProductosValidos}
              className="w-full md:w-auto flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Registrar Venta</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
