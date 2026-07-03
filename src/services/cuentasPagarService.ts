import { supabase } from './supabaseClient';
import { CuentaPagarDetalle } from '../types/cuentaPagar';
import { Compra } from '../types/compra';
import {
  MOCK_PROVEEDORES,
  MOCK_MONEDAS,
  MOCK_PLAZOS,
  MOCK_PLAZO_DETALLES,
  MOCK_TIPOS_DOCUMENTO
} from './catalogosService';
import { calcularCuotasPreview } from '../utils/cuotasPreview';
import { formatInvoice } from '../utils/formatters';

const LOCAL_STORAGE_CUENTAS_PAGAR = 'gqg_cuentas_pagar_db';

// Lee de localStorage las cuotas de cuentas a pagar simuladas
const getLocalCuentasPagar = (): CuentaPagarDetalle[] => {
  const local = localStorage.getItem(LOCAL_STORAGE_CUENTAS_PAGAR);
  return local ? JSON.parse(local) : [];
};

// Guarda en localStorage las cuotas de cuentas a pagar simuladas
const saveLocalCuentasPagar = (cuentas: CuentaPagarDetalle[]) => {
  localStorage.setItem(LOCAL_STORAGE_CUENTAS_PAGAR, JSON.stringify(cuentas));
};

/**
 * Simulación offline del trigger PostgreSQL para compras.
 * Usa la misma lógica que calcularCuotasPreview para mantener consistencia.
 */
export const simulateCuentasPagarTrigger = (compra: Compra) => {
  const proveedor = MOCK_PROVEEDORES.find((p) => p.id === compra.proveedor_id)?.ruc || `Proveedor #${compra.proveedor_id}`;
  const monedaObj = MOCK_MONEDAS.find((m) => m.id === compra.moneda_id);
  const monedaDesc = monedaObj?.descripcion || 'Guaraníes';
  const monedaAbrev = monedaObj?.abreviatura || 'PYG';
  const plazoObj = MOCK_PLAZOS.find((p) => p.id === compra.plazo_id);
  const plazoDesc = plazoObj?.plazo || `Plazo #${compra.plazo_id}`;
  const tipoDoc = MOCK_TIPOS_DOCUMENTO.find((t) => t.id === compra.tipo_doc_id);
  const detalles = MOCK_PLAZO_DETALLES.filter((d) => d.plazo_id === compra.plazo_id);

  const preview = calcularCuotasPreview(
    compra.fecha_factura,
    compra.total_factura,
    tipoDoc,
    plazoObj,
    detalles
  );

  const existingCuentas = getLocalCuentasPagar().filter((c) => c.compra_id !== compra.id);
  const numCuotas = plazoObj?.cuotas || 1;

  const cuotasGeneradas: CuentaPagarDetalle[] = preview.map((row) => ({
    cuenta_id: Number(`300${compra.id}${row.cuota}`),
    compra_id: compra.id,
    fecha_proceso: compra.fecha_proceso,
    fecha_factura: compra.fecha_factura,
    factura: formatInvoice(compra.serie, compra.nro_factura),
    timbrado: compra.timbrado,
    total_factura: compra.total_factura,
    proveedor_id: compra.proveedor_id,
    proveedor,
    moneda: monedaDesc,
    moneda_abreviatura: monedaAbrev,
    plazo: plazoDesc,
    cuotas: numCuotas,
    cuota: row.cuota,
    cuota_texto: row.cuota_texto,
    importe: row.importe,
    vence: row.vence,
    pagado: row.cobrado,
    saldo: row.importe,
    estado: 'PENDIENTE'
  }));

  saveLocalCuentasPagar([...existingCuentas, ...cuotasGeneradas]);
};

export const cuentasPagarService = {
  async getCuentasPagar(): Promise<CuentaPagarDetalle[]> {
    try {
      const { data, error } = await supabase
        .from('v_cuentas_pagar_detalle')
        .select('*')
        .order('vence', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Falla al consultar v_cuentas_pagar_detalle de Supabase. Usando base de datos simulada en localStorage.', error);
      
      const localCuentas = getLocalCuentasPagar();
      if (localCuentas.length === 0) {
        const local = localStorage.getItem('gqg_compras_db');
        if (local) {
          const compras: Compra[] = JSON.parse(local);
          compras.forEach(c => simulateCuentasPagarTrigger(c));
          return getLocalCuentasPagar().sort((a, b) => new Date(a.vence).getTime() - new Date(b.vence).getTime());
        }
      }
      
      return localCuentas.sort((a, b) => new Date(a.vence).getTime() - new Date(b.vence).getTime());
    }
  },

  async getCuentasByCompraId(compraId: number): Promise<CuentaPagarDetalle[]> {
    try {
      const { data, error } = await supabase
        .from('v_cuentas_pagar_detalle')
        .select('*')
        .eq('compra_id', compraId)
        .order('cuota', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn(`Falla al consultar cuotas para compra ${compraId} de Supabase. Buscando en localStorage simulado.`, error);
      const cuentas = getLocalCuentasPagar();
      return cuentas
        .filter(c => c.compra_id === compraId)
        .sort((a, b) => a.cuota - b.cuota);
    }
  },

  async registrarPago(cuentaId: number, montoAPagar: number): Promise<CuentaPagarDetalle | null> {
    try {
      const { data: cuenta, error: fetchError } = await supabase
        .from('cuentas_pagar')
        .select('id, importe, pagado')
        .eq('id', cuentaId)
        .single();

      if (fetchError || !cuenta) throw fetchError || new Error('Cuota no encontrada');

      const nuevoPagado = Math.min(Number(cuenta.importe), Number(cuenta.pagado) + montoAPagar);
      const nuevoSaldo = Math.max(0, Number(cuenta.importe) - nuevoPagado);
      const nuevoEstado = nuevoSaldo === 0 ? 'PAGADO' : 'PENDIENTE';

      const { error: updateError } = await supabase
        .from('cuentas_pagar')
        .update({ pagado: nuevoPagado, saldo: nuevoSaldo, estado: nuevoEstado })
        .eq('id', cuentaId);

      if (updateError) throw updateError;

      const { data: actualizada, error: viewError } = await supabase
        .from('v_cuentas_pagar_detalle')
        .select('*')
        .eq('cuenta_id', cuentaId)
        .single();

      if (viewError) throw viewError;
      return actualizada;
    } catch (error) {
      console.warn('Falla al registrar pago en Supabase. Usando localStorage.', error);
      return this.registrarPagoOffline(cuentaId, montoAPagar);
    }
  },

  async registrarPagoOffline(cuentaId: number, montoAPagar: number): Promise<CuentaPagarDetalle | null> {
    const cuentas = getLocalCuentasPagar();
    const index = cuentas.findIndex(c => c.cuenta_id === cuentaId);

    if (index !== -1) {
      const c = cuentas[index];
      const nuevoPagado = Math.min(c.importe, c.pagado + montoAPagar);
      const nuevoSaldo = Math.max(0, c.importe - nuevoPagado);

      cuentas[index] = {
        ...c,
        pagado: nuevoPagado,
        saldo: nuevoSaldo,
        estado: nuevoSaldo === 0 ? 'PAGADO' : 'PENDIENTE'
      };

      saveLocalCuentasPagar(cuentas);
      return cuentas[index];
    }

    return null;
  }
};
