import React, { useState, useEffect } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ErrorMessage } from '../ui/ErrorMessage';
import { Proveedor, Moneda, Deposito, TipoDocumento, Plazo } from '../../types/catalogos';
import { NuevaCompraPayload } from '../../types/compra';
import { CuentaPagarDetalle } from '../../types/cuentaPagar';
import { cuentasPagarService } from '../../services/cuentasPagarService';
import { formatCurrency, formatInvoice } from '../../utils/formatters';
import { CondicionPagoSection } from '../shared/CondicionPagoSection';
import { CuentaDetallePanel } from '../cuentas/CuentaDetallePanel';
import { Save, PlusCircle, CheckCircle, Calendar, CreditCard, DollarSign } from 'lucide-react';

interface CompraFormProps {
  proveedores: Proveedor[];
  monedas: Moneda[];
  depositos: Deposito[];
  tiposDoc: TipoDocumento[];
  plazos: Plazo[];
  onSubmit: (payload: NuevaCompraPayload) => Promise<any>;
}

export const CompraForm: React.FC<CompraFormProps> = ({
  proveedores,
  monedas,
  depositos,
  tiposDoc,
  plazos,
  onSubmit
}) => {
  // Estados del Formulario
  const [fechaFactura, setFechaFactura] = useState(new Date().toISOString().split('T')[0]);
  const [proveedorId, setProveedorId] = useState('');
  const [serie, setSerie] = useState('001-001');
  const [nroFactura, setNroFactura] = useState('');
  const [timbrado, setTimbrado] = useState('87654321');
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
  const [successCompra, setSuccessCompra] = useState<any | null>(null);
  const [cuotasGeneradas, setCuotasGeneradas] = useState<CuentaPagarDetalle[]>([]);

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
    if (!proveedorId) return 'Debe seleccionar un proveedor.';
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

      // Registrar compra
      const compraRegistrada = await onSubmit(payload);
      setSuccessCompra(compraRegistrada);

      // Inmediatamente después de insertar, consultar v_cuentas_pagar_detalle para la compra recién creada
      const cuotas = await cuentasPagarService.getCuentasByCompraId(compraRegistrada.id);
      setCuotasGeneradas(cuotas);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar la compra. Verifique la compatibilidad de plazos en la base de datos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setProveedorId('');
    setNroFactura('');
    setTipoDocId('');
    setPlazoId('');
    setTotalExento('0');
    setTotalBase('0');
    setTotalImpuesto('0');
    setSuccessCompra(null);
    setCuotasGeneradas([]);
    setErrorMsg('');
  };

  const monedaAbrev = monedas.find(m => m.id === Number(monedaId))?.abreviatura || 'PYG';
  const monedaDesc = monedas.find(m => m.id === Number(monedaId))?.descripcion || 'Guaraníes';
  const proveedorRuc = proveedores.find(p => p.id === Number(proveedorId))?.ruc || '';

  return (
    <div className="space-y-6">
      {errorMsg && (
        <ErrorMessage
          title="Fallo en Validación / Regla de Negocio"
          message={errorMsg}
        />
      )}

      {successCompra && (
        <Card className="bg-emerald-50/40 border-2 border-emerald-300 shadow-lg shadow-emerald-200/50 animate-fade-in">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-grow space-y-2">
              <h3 className="text-base font-bold text-emerald-800">
                ¡Compra Registrada Exitosamente en GQG System!
              </h3>
              <p className="text-sm text-emerald-700">
                La factura de compra <span className="font-extrabold">{formatInvoice(successCompra.serie, successCompra.nro_factura)}</span> por un total de <span className="font-extrabold">{formatCurrency(successCompra.total_factura, monedaAbrev)}</span> ha sido procesada de manera correcta.
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

              <div className="pt-2">
                <Button
                  variant="primary"
                  onClick={handleReset}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10 shadow-lg"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Registrar Otra Compra</span>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {!successCompra && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECCIÓN 1: DATOS GENERALES DE LA COMPRA */}
          <Card className="p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-800 border-b-2 border-slate-300 pb-2.5 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-600" />
              <span>Sección 1: Cabecera y Proveedor</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select
                label="Proveedor"
                value={proveedorId}
                onChange={(e) => setProveedorId(e.target.value)}
                required
                options={[
                  { value: '', label: 'Seleccione un proveedor...' },
                  ...proveedores.map(p => ({ value: p.id, label: `${p.ruc}` }))
                ]}
              />

              <Input
                label="Fecha de Factura"
                type="date"
                value={fechaFactura}
                onChange={(e) => setFechaFactura(e.target.value)}
                required
              />

              <Select
                label="Depósito Destino"
                value={depositoId}
                onChange={(e) => setDepositoId(e.target.value)}
                required
                options={depositos.map(d => ({ value: d.id, label: d.descripcion }))}
              />

              <Select
                label="Moneda"
                value={monedaId}
                onChange={(e) => setMonedaId(e.target.value)}
                required
                options={monedas.map(m => ({ value: m.id, label: `${m.descripcion} (${m.abreviatura})` }))}
              />
            </div>
          </Card>

          {/* SECCIÓN 2: DATOS DEL COMPROBANTE */}
          <Card className="p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-800 border-b-2 border-slate-300 pb-2.5 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-600" />
              <span>Sección 2: Factura y Timbrado de Compra</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                label="Serie (Establecimiento-Punto Emisión)"
                placeholder="Ej: 001-001"
                value={serie}
                onChange={(e) => setSerie(e.target.value)}
                required
              />

              <Input
                label="Número de Factura"
                type="number"
                placeholder="Ej: 14500"
                value={nroFactura}
                onChange={(e) => setNroFactura(e.target.value)}
                required
              />

              <Input
                label="Número de Timbrado"
                placeholder="Ej: 87654321"
                value={timbrado}
                onChange={(e) => setTimbrado(e.target.value)}
                required
              />

              <Input
                label="Vencimiento de Timbrado"
                type="date"
                value={timbradoVence}
                onChange={(e) => setTimbradoVence(e.target.value)}
                required
              />
            </div>
          </Card>

          {/* SECCIÓN 3: IMPORTES */}
          <Card className="p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-800 border-b-2 border-slate-300 pb-2.5 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-brand-600" />
              <span>Sección 3: Importes Desglosados</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label={`Importe Exento (${monedaAbrev})`}
                type="number"
                min="0"
                value={totalExento}
                onChange={(e) => setTotalExento(e.target.value)}
              />

              <Input
                label={`Importe Base Grabado (${monedaAbrev})`}
                type="number"
                min="0"
                value={totalBase}
                onChange={(e) => setTotalBase(e.target.value)}
              />

              <Input
                label={`Importe IVA (${monedaAbrev})`}
                type="number"
                min="0"
                value={totalImpuesto}
                onChange={(e) => setTotalImpuesto(e.target.value)}
              />
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border-2 border-slate-300 shadow-md shadow-slate-200/70 flex items-center justify-between mt-4">
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Total Factura Consolidado</span>
                <p className="text-xs text-slate-400 mt-0.5">Suma automática de exento, base grabada e impuestos</p>
              </div>
              <span className="text-2xl font-black text-slate-800">
                {formatCurrency(totalFactura, monedaAbrev)}
              </span>
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

          {/* BOTÓN REGISTRAR */}
          <div className="flex justify-end gap-3">
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              disabled={!tipoDocId || !plazoId}
              className="flex items-center gap-2 shadow-brand-500/10 shadow-lg px-6"
            >
              <Save className="w-4 h-4" />
              <span>Registrar Compra en Sistema</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
