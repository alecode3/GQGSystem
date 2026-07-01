import { supabase } from './supabaseClient';
import { CuentaPagarDetalle } from '../types/cuentaPagar';
import { Compra } from '../types/compra';
import { MOCK_PROVEEDORES, MOCK_MONEDAS, MOCK_PLAZOS } from './catalogosService';
import { addDays } from '../utils/dates';
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
 * SIMULACIÓN DEL TRIGGER DE POSTGRESQL EN EL FRONTEND PARA COMPRAS
 * Genera automáticamente registros de cuotas en cuentas_pagar basándose en el plazo y tipo de documento.
 * Guarda los resultados formateados en la estructura de la vista v_cuentas_pagar_detalle.
 */
export const simulateCuentasPagarTrigger = (compra: Compra) => {
  const proveedor = MOCK_PROVEEDORES.find(p => p.id === compra.proveedor_id)?.ruc || `Proveedor #${compra.proveedor_id}`;
  const monedaObj = MOCK_MONEDAS.find(m => m.id === compra.moneda_id);
  const monedaDesc = monedaObj?.descripcion || 'Guaraníes';
  const monedaAbrev = monedaObj?.abreviatura || 'PYG';
  const plazoObj = MOCK_PLAZOS.find(p => p.id === compra.plazo_id);
  const plazoDesc = plazoObj?.plazo || `Plazo #${compra.plazo_id}`;
  
  const cuotasGeneradas: CuentaPagarDetalle[] = [];
  const existingCuentas = getLocalCuentasPagar().filter(c => c.compra_id !== compra.id); // Evitar duplicados
  
  let totalImportes = 0;
  
  // Reglas del trigger según el tipo de plazo
  if (compra.plazo_id === 1) {
    // Contado: 1 cuota que vence el mismo día
    const cuota: CuentaPagarDetalle = {
      cuenta_id: Number(`300${compra.id}1`),
      compra_id: compra.id,
      fecha_proceso: compra.fecha_proceso,
      fecha_factura: compra.fecha_factura,
      factura: formatInvoice(compra.serie, compra.nro_factura),
      timbrado: compra.timbrado,
      total_factura: compra.total_factura,
      proveedor_id: compra.proveedor_id,
      proveedor: proveedor,
      moneda: monedaDesc,
      moneda_abreviatura: monedaAbrev,
      plazo: plazoDesc,
      cuotas: 1,
      cuota: 1,
      cuota_texto: '1/1',
      importe: compra.total_factura,
      vence: compra.fecha_factura,
      pagado: 0,
      saldo: compra.total_factura,
      estado: 'PENDIENTE'
    };
    cuotasGeneradas.push(cuota);
  } 
  else if (compra.plazo_id === 2) {
    // Crédito 30 días: 1 cuota a 30 días
    const cuota: CuentaPagarDetalle = {
      cuenta_id: Number(`300${compra.id}1`),
      compra_id: compra.id,
      fecha_proceso: compra.fecha_proceso,
      fecha_factura: compra.fecha_factura,
      factura: formatInvoice(compra.serie, compra.nro_factura),
      timbrado: compra.timbrado,
      total_factura: compra.total_factura,
      proveedor_id: compra.proveedor_id,
      proveedor: proveedor,
      moneda: monedaDesc,
      moneda_abreviatura: monedaAbrev,
      plazo: plazoDesc,
      cuotas: 1,
      cuota: 1,
      cuota_texto: '1/1',
      importe: compra.total_factura,
      vence: addDays(compra.fecha_factura, 30),
      pagado: 0,
      saldo: compra.total_factura,
      estado: 'PENDIENTE'
    };
    cuotasGeneradas.push(cuota);
  }
  else if (compra.plazo_id === 3) {
    // Crédito Regular: 3 cuotas a 30/60/90 días
    const numCuotas = 3;
    const importePorCuota = Math.round(compra.total_factura / numCuotas);
    
    for (let c = 1; c <= numCuotas; c++) {
      const importeFinal = c === numCuotas ? (compra.total_factura - totalImportes) : importePorCuota;
      totalImportes += importeFinal;
      
      const cuota: CuentaPagarDetalle = {
        cuenta_id: Number(`300${compra.id}${c}`),
        compra_id: compra.id,
        fecha_proceso: compra.fecha_proceso,
        fecha_factura: compra.fecha_factura,
        factura: formatInvoice(compra.serie, compra.nro_factura),
        timbrado: compra.timbrado,
        total_factura: compra.total_factura,
        proveedor_id: compra.proveedor_id,
        proveedor: proveedor,
        moneda: monedaDesc,
        moneda_abreviatura: monedaAbrev,
        plazo: plazoDesc,
        cuotas: numCuotas,
        cuota: c,
        cuota_texto: `${c}/${numCuotas}`,
        importe: importeFinal,
        vence: addDays(compra.fecha_factura, c * 30),
        pagado: 0,
        saldo: importeFinal,
        estado: 'PENDIENTE'
      };
      cuotasGeneradas.push(cuota);
    }
  }
  else if (compra.plazo_id === 4) {
    // Crédito Irregular: 2 cuotas a 45 y 75 días
    const numCuotas = 2;
    const porcentajes = [0.45, 0.55];
    const vencimientos = [45, 75];
    
    for (let c = 1; c <= numCuotas; c++) {
      const importeFinal = c === numCuotas 
        ? (compra.total_factura - totalImportes) 
        : Math.round(compra.total_factura * porcentajes[c - 1]);
      totalImportes += importeFinal;
      
      const cuota: CuentaPagarDetalle = {
        cuenta_id: Number(`300${compra.id}${c}`),
        compra_id: compra.id,
        fecha_proceso: compra.fecha_proceso,
        fecha_factura: compra.fecha_factura,
        factura: formatInvoice(compra.serie, compra.nro_factura),
        timbrado: compra.timbrado,
        total_factura: compra.total_factura,
        proveedor_id: compra.proveedor_id,
        proveedor: proveedor,
        moneda: monedaDesc,
        moneda_abreviatura: monedaAbrev,
        plazo: plazoDesc,
        cuotas: numCuotas,
        cuota: c,
        cuota_texto: `${c}/${numCuotas}`,
        importe: importeFinal,
        vence: addDays(compra.fecha_factura, vencimientos[c - 1]),
        pagado: 0,
        saldo: importeFinal,
        estado: 'PENDIENTE'
      };
      cuotasGeneradas.push(cuota);
    }
  } else {
    // Fallback genérico para plazos creados en el ABM
    // Si podemos deducir que es irregular, buscaremos crear cuotas con espaciado mensual, o intentar emular
    const numCuotas = plazoObj?.cuotas || 1;
    const importePorCuota = Math.round(compra.total_factura / numCuotas);
    const irregular = plazoObj?.irregular || false;
    
    for (let c = 1; c <= numCuotas; c++) {
      const importeFinal = c === numCuotas ? (compra.total_factura - totalImportes) : importePorCuota;
      totalImportes += importeFinal;
      
      // Intentar adivinar días: si es irregular y no es plazo 4, hacemos intervalos de 15, 30, 45, etc. o mensual
      const diasCalculados = irregular ? c * 20 : c * 30;
      
      const cuota: CuentaPagarDetalle = {
        cuenta_id: Number(`300${compra.id}${c}`),
        compra_id: compra.id,
        fecha_proceso: compra.fecha_proceso,
        fecha_factura: compra.fecha_factura,
        factura: formatInvoice(compra.serie, compra.nro_factura),
        timbrado: compra.timbrado,
        total_factura: compra.total_factura,
        proveedor_id: compra.proveedor_id,
        proveedor: proveedor,
        moneda: monedaDesc,
        moneda_abreviatura: monedaAbrev,
        plazo: plazoDesc,
        cuotas: numCuotas,
        cuota: c,
        cuota_texto: `${c}/${numCuotas}`,
        importe: importeFinal,
        vence: addDays(compra.fecha_factura, diasCalculados),
        pagado: 0,
        saldo: importeFinal,
        estado: 'PENDIENTE'
      };
      cuotasGeneradas.push(cuota);
    }
  }
  
  // Guardar en la base de datos local simulada
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

  // Simulación para permitir pagar una cuota de forma offline
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
