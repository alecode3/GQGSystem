import React, { useState, useEffect } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ErrorMessage } from '../ui/ErrorMessage';
import { Cliente, Moneda, Deposito, TipoDocumento, Plazo } from '../../types/catalogos';
import { NuevaVentaPayload } from '../../types/venta';
import { CuentaCobrarDetalle } from '../../types/cuentaCobrar';
import { cuentasCobrarService } from '../../services/cuentasCobrarService';
import { formatCurrency, formatInvoice, getClienteNombreByRuc } from '../../utils/formatters';
import { CondicionPagoSection } from '../shared/CondicionPagoSection';
import { CuentaDetallePanel } from '../cuentas/CuentaDetallePanel';
import { Save, PlusCircle, CheckCircle, Calendar, DollarSign, Printer } from 'lucide-react';
import { printInvoice } from '../../utils/invoicePrinter';


interface VentaFormProps {
  clientes: Cliente[];
  monedas: Moneda[];
  depositos: Deposito[];
  tiposDoc: TipoDocumento[];
  plazos: Plazo[];
  onSubmit: (payload: NuevaVentaPayload) => Promise<any>;
}

export const VentaForm: React.FC<VentaFormProps> = ({
  clientes,
  monedas,
  depositos,
  tiposDoc,
  plazos,
  onSubmit
}) => {
  // Estados del Formulario
  const [fechaFactura, setFechaFactura] = useState(new Date().toISOString().split('T')[0]);
  const [clienteId, setClienteId] = useState('');
  const [serie, setSerie] = useState('001-001');
  const [nroFactura, setNroFactura] = useState('');
  const [timbrado, setTimbrado] = useState('12345678');
  const [timbradoVence, setTimbradoVence] = useState(
    new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
  );
  const [depositoId, setDepositoId] = useState('1');
  const [monedaId, setMonedaId] = useState('1');
  const [tipoDocId, setTipoDocId] = useState('');
  const [plazoId, setPlazoId] = useState('');
  
  // Totales
  const [totalExento, setTotalExento] = useState('0');
  const [totalBase, setTotalBase] = useState('0');
  const [totalImpuesto, setTotalImpuesto] = useState('0');
  const [totalFactura, setTotalFactura] = useState(0);

  // Estados de carga, error y éxito
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successVenta, setSuccessVenta] = useState<any | null>(null);
  const [cuotasGeneradas, setCuotasGeneradas] = useState<CuentaCobrarDetalle[]>([]);

  // Recalcular el total_factura automáticamente cuando cambian los importes individuales
  useEffect(() => {
    const exento = parseFloat(totalExento) || 0;
    const base = parseFloat(totalBase) || 0;
    const impuesto = parseFloat(totalImpuesto) || 0;
    setTotalFactura(exento + base + impuesto);
  }, [totalExento, totalBase, totalImpuesto]);

  const handleCondicionChange = (nuevoTipoDocId: string, nuevoPlazoId: string) => {
    setTipoDocId(nuevoTipoDocId);
    setPlazoId(nuevoPlazoId);
  };

  const handlePlazoChange = (nuevoPlazoId: string) => {
    setPlazoId(nuevoPlazoId);
  };

  const validateForm = (): string | null => {
    if (!clienteId) return 'Debe seleccionar un cliente.';
    if (!depositoId) return 'Debe seleccionar un depósito.';
    if (!monedaId) return 'Debe seleccionar una moneda.';
    if (!tipoDocId) return 'Debe seleccionar la condición de pago (Contado o Crédito).';
    if (!plazoId) return 'Debe seleccionar el plan de cuotas.';
    if (!fechaFactura) return 'La fecha de la factura es obligatoria.';
    if (!timbrado.trim()) return 'El número de timbrado es obligatorio.';
    if (!timbradoVence) return 'La fecha de vencimiento del timbrado es obligatoria.';
    if (!serie.trim()) return 'La serie de la factura es obligatoria (ej: 001-001).';
    if (!nroFactura || parseInt(nroFactura) <= 0) return 'El número de factura debe ser un número entero mayor a 0.';
    if (totalFactura <= 0) return 'El total de la factura debe ser mayor a 0.';

    // Validar compatibilidad de plazo
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
        serie: serie.trim(),
        nro_factura: Number(nroFactura),
        timbrado: timbrado.trim(),
        timbrado_vence: timbradoVence,
        total_exento: parseFloat(totalExento) || 0,
        total_impuesto: parseFloat(totalImpuesto) || 0,
        total_base: parseFloat(totalBase) || 0,
        total_factura: totalFactura,
        deposito_id: Number(depositoId),
        moneda_id: Number(monedaId),
        tipo_doc_id: Number(tipoDocId),
        plazo_id: Number(plazoId)
      };

      // Registrar venta
      const ventaRegistrada = await onSubmit(payload);
      setSuccessVenta(ventaRegistrada);

      // Inmediatamente después de insertar, consultar v_cuentas_cobrar_detalle para la venta recién creada
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
    setNroFactura('');
    setTipoDocId('');
    setPlazoId('');
    setTotalExento('0');
    setTotalBase('0');
    setTotalImpuesto('0');
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
        <Card className="bg-emerald-50/40 border-2 border-emerald-300 shadow-lg shadow-emerald-200/50 animate-fade-in">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-grow space-y-2">
              <h3 className="text-base font-bold text-emerald-800">
                ¡Venta Registrada Exitosamente en GQG System!
              </h3>
              <p className="text-sm text-emerald-700">
                La factura <span className="font-extrabold">{formatInvoice(successVenta.serie, successVenta.nro_factura)}</span> por un total de <span className="font-extrabold">{formatCurrency(successVenta.total_factura, monedaAbrev)}</span> ha sido procesada de manera correcta.
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
                    const dSel = depositos.find(d => d.id === successVenta.deposito_id);
                    const mSel = monedas.find(m => m.id === successVenta.moneda_id);
                    const tSel = tiposDoc.find(t => t.id === successVenta.tipo_doc_id);
                    const cSel = clientes.find(c => c.id === successVenta.cliente_id);

                    printInvoice(successVenta, {
                      clienteRuc: cSel?.ruc,
                      clienteDireccion: cSel?.direccion,
                      clienteTelefono: cSel?.telefono,
                      monedaDesc: mSel?.descripcion,
                      monedaAbrev: mSel?.abreviatura,
                      depositoDesc: dSel?.descripcion,
                      tipoDocDesc: tSel?.descripcion,
                      plazoDesc: pSel?.plazo
                    });
                  }}
                  className="flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-emerald-600" />
                  <span>Imprimir / Descargar Factura</span>
                </Button>

                
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleReset}
                  className="flex items-center gap-1.5"
                >
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
              <h2 className="text-base font-bold text-slate-800">
                Sección 1: Datos de Factura
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Fecha de Factura"
                type="date"
                value={fechaFactura}
                onChange={(e) => setFechaFactura(e.target.value)}
                required
              />
              <Input
                label="Serie Factura"
                placeholder="001-001"
                value={serie}
                onChange={(e) => setSerie(e.target.value)}
                required
                helperText="Formato estándar paraguayo (ej. 001-001)"
              />
              <Input
                label="Nro. Factura"
                type="number"
                placeholder="Ej: 1450"
                value={nroFactura}
                onChange={(e) => setNroFactura(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Número de Timbrado"
                placeholder="Ej: 12345678"
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

          {/* SECCIÓN 2: CLIENTE Y MONEDA */}
          <Card className="space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-slate-300 pb-3">
              <DollarSign className="w-5 h-5 text-brand-600" />
              <h2 className="text-base font-bold text-slate-800">
                Sección 2: Cliente, Depósito y Moneda
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Seleccionar Cliente"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                placeholder="Seleccione un cliente..."
                required
                options={clientes.map(c => ({ value: c.id, label: getClienteNombreByRuc(c.ruc) }))}
              />
              <Select
                label="Depósito Comercial"
                value={depositoId}
                onChange={(e) => setDepositoId(e.target.value)}
                required
                options={depositos.map(d => ({ value: d.id, label: d.descripcion }))}
              />
              <Select
                label="Moneda de Transacción"
                value={monedaId}
                onChange={(e) => setMonedaId(e.target.value)}
                required
                options={monedas.map(m => ({ value: m.id, label: `${m.descripcion} (${m.abreviatura})` }))}
              />
            </div>
          </Card>

          {/* SECCIÓN 3: TOTALES */}
          <Card className="space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-slate-300 pb-3">
              <DollarSign className="w-5 h-5 text-brand-600" />
              <h2 className="text-base font-bold text-slate-800">
                Sección 3: Desglose de Totales
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label={`Total Exento (${monedaAbrev})`}
                type="number"
                value={totalExento}
                onChange={(e) => setTotalExento(e.target.value)}
                min="0"
                step="any"
              />
              <Input
                label={`Total Base Imponible (${monedaAbrev})`}
                type="number"
                value={totalBase}
                onChange={(e) => setTotalBase(e.target.value)}
                min="0"
                step="any"
              />
              <Input
                label={`Total Impuesto IVA (${monedaAbrev})`}
                type="number"
                value={totalImpuesto}
                onChange={(e) => setTotalImpuesto(e.target.value)}
                min="0"
                step="any"
              />
            </div>

            {/* Visualización del Total Calculado en Grande */}
            <div className="p-5 bg-slate-50 border-2 border-slate-300 rounded-xl shadow-md shadow-slate-200/70 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                  TOTAL A FACTURAR (AUTOCALCULADO)
                </span>
                <span className="text-[10px] font-semibold text-slate-500">
                  Suma de Exento + Base + IVA
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-slate-900">
                  {formatCurrency(totalFactura, monedaAbrev)}
                </span>
              </div>
            </div>

          </Card>

          {/* SECCIÓN 4: CONDICIÓN DE PAGO Y PREVISUALIZACIÓN */}
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
              disabled={!tipoDocId || !plazoId}
              className="w-full md:w-auto flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Registrar Venta en Sistema</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
