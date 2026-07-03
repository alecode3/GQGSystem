import { supabase } from './supabaseClient';
import { CuentaCobrarDetalle } from '../types/cuentaCobrar';
import { Venta } from '../types/venta';
import {
  MOCK_CLIENTES,
  MOCK_MONEDAS,
  MOCK_PLAZOS,
  MOCK_PLAZO_DETALLES,
  MOCK_TIPOS_DOCUMENTO
} from './catalogosService';
import { calcularCuotasPreview } from '../utils/cuotasPreview';
import { formatInvoice } from '../utils/formatters';

const LOCAL_STORAGE_CUENTAS = 'gqg_cuentas_cobrar_db';

const getLocalCuentas = (): CuentaCobrarDetalle[] => {
  const local = localStorage.getItem(LOCAL_STORAGE_CUENTAS);
  return local ? JSON.parse(local) : [];
};

const saveLocalCuentas = (cuentas: CuentaCobrarDetalle[]) => {
  localStorage.setItem(LOCAL_STORAGE_CUENTAS, JSON.stringify(cuentas));
};

/**
 * Simulación offline del trigger PostgreSQL.
 * Usa la misma lógica que calcularCuotasPreview para mantener consistencia.
 */
export const simulateCuentasCobrarTrigger = (venta: Venta) => {
  const cliente = MOCK_CLIENTES.find((c) => c.id === venta.cliente_id)?.ruc || `Cliente #${venta.cliente_id}`;
  const monedaObj = MOCK_MONEDAS.find((m) => m.id === venta.moneda_id);
  const monedaDesc = monedaObj?.descripcion || 'Guaraníes';
  const monedaAbrev = monedaObj?.abreviatura || 'PYG';
  const plazoObj = MOCK_PLAZOS.find((p) => p.id === venta.plazo_id);
  const plazoDesc = plazoObj?.plazo || `Plazo #${venta.plazo_id}`;
  const tipoDoc = MOCK_TIPOS_DOCUMENTO.find((t) => t.id === venta.tipo_doc_id);
  const detalles = MOCK_PLAZO_DETALLES.filter((d) => d.plazo_id === venta.plazo_id);

  const preview = calcularCuotasPreview(
    venta.fecha_factura,
    venta.total_factura,
    tipoDoc,
    plazoObj,
    detalles
  );

  const existingCuentas = getLocalCuentas().filter((c) => c.venta_id !== venta.id);
  const numCuotas = plazoObj?.cuotas || 1;

  const cuotasGeneradas: CuentaCobrarDetalle[] = preview.map((row) => ({
    cuenta_id: Number(`200${venta.id}${row.cuota}`),
    venta_id: venta.id,
    fecha_proceso: venta.fecha_proceso,
    fecha_factura: venta.fecha_factura,
    factura: formatInvoice(venta.serie, venta.nro_factura),
    timbrado: venta.timbrado,
    total_factura: venta.total_factura,
    cliente_id: venta.cliente_id,
    cliente,
    moneda: monedaDesc,
    moneda_abreviatura: monedaAbrev,
    plazo: plazoDesc,
    cuotas: numCuotas,
    cuota: row.cuota,
    cuota_texto: row.cuota_texto,
    importe: row.importe,
    vence: row.vence,
    cobrado: row.cobrado,
    saldo: row.importe,
    estado: 'PENDIENTE'
  }));

  saveLocalCuentas([...existingCuentas, ...cuotasGeneradas]);
};

export const cuentasCobrarService = {
  async getCuentasCobrar(): Promise<CuentaCobrarDetalle[]> {
    try {
      const { data, error } = await supabase
        .from('v_cuentas_cobrar_detalle')
        .select('*')
        .order('vence', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Falla al consultar v_cuentas_cobrar_detalle de Supabase. Usando base de datos simulada en localStorage.', error);
      
      const localCuentas = getLocalCuentas();
      if (localCuentas.length === 0) {
        const local = localStorage.getItem('gqg_ventas_db');
        if (local) {
          const ventas: Venta[] = JSON.parse(local);
          ventas.forEach((v) => simulateCuentasCobrarTrigger(v));
          return getLocalCuentas().sort((a, b) => new Date(a.vence).getTime() - new Date(b.vence).getTime());
        }
      }
      
      return localCuentas.sort((a, b) => new Date(a.vence).getTime() - new Date(b.vence).getTime());
    }
  },

  async getCuentasByVentaId(ventaId: number): Promise<CuentaCobrarDetalle[]> {
    try {
      const { data, error } = await supabase
        .from('v_cuentas_cobrar_detalle')
        .select('*')
        .eq('venta_id', ventaId)
        .order('cuota', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn(`Falla al consultar cuotas para venta ${ventaId} de Supabase. Buscando en localStorage simulado.`, error);
      const cuentas = getLocalCuentas();
      return cuentas
        .filter((c) => c.venta_id === ventaId)
        .sort((a, b) => a.cuota - b.cuota);
    }
  },

  async registrarCobro(cuentaId: number, montoACobrar: number): Promise<CuentaCobrarDetalle | null> {
    try {
      const { data: cuenta, error: fetchError } = await supabase
        .from('cuentas_cobrar')
        .select('id, importe, cobrado')
        .eq('id', cuentaId)
        .single();

      if (fetchError || !cuenta) throw fetchError || new Error('Cuota no encontrada');

      const nuevoCobrado = Math.min(Number(cuenta.importe), Number(cuenta.cobrado) + montoACobrar);
      const nuevoSaldo = Math.max(0, Number(cuenta.importe) - nuevoCobrado);
      const nuevoEstado = nuevoSaldo === 0 ? 'COBRADO' : 'PENDIENTE';

      const { error: updateError } = await supabase
        .from('cuentas_cobrar')
        .update({ cobrado: nuevoCobrado, saldo: nuevoSaldo, estado: nuevoEstado })
        .eq('id', cuentaId);

      if (updateError) throw updateError;

      const { data: actualizada, error: viewError } = await supabase
        .from('v_cuentas_cobrar_detalle')
        .select('*')
        .eq('cuenta_id', cuentaId)
        .single();

      if (viewError) throw viewError;
      return actualizada;
    } catch (error) {
      console.warn('Falla al registrar cobro en Supabase. Usando localStorage.', error);
      return this.registrarCobroOffline(cuentaId, montoACobrar);
    }
  },

  async registrarCobroOffline(cuentaId: number, montoACobrar: number): Promise<CuentaCobrarDetalle | null> {
    const cuentas = getLocalCuentas();
    const index = cuentas.findIndex((c) => c.cuenta_id === cuentaId);

    if (index !== -1) {
      const c = cuentas[index];
      const nuevoCobrado = Math.min(c.importe, c.cobrado + montoACobrar);
      const nuevoSaldo = Math.max(0, c.importe - nuevoCobrado);

      cuentas[index] = {
        ...c,
        cobrado: nuevoCobrado,
        saldo: nuevoSaldo,
        estado: nuevoSaldo === 0 ? 'COBRADO' : 'PENDIENTE'
      };

      saveLocalCuentas(cuentas);
      return cuentas[index];
    }

    return null;
  }
};
