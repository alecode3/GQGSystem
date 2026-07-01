import { supabase } from './supabaseClient';
import { CuentaCobrarDetalle } from '../types/cuentaCobrar';
import { Venta } from '../types/venta';
import { MOCK_CLIENTES, MOCK_MONEDAS, MOCK_PLAZOS } from './catalogosService';
import { addDays } from '../utils/dates';
import { formatInvoice } from '../utils/formatters';

const LOCAL_STORAGE_CUENTAS = 'gqg_cuentas_cobrar_db';

// Lee de localStorage las cuotas simuladas
const getLocalCuentas = (): CuentaCobrarDetalle[] => {
  const local = localStorage.getItem(LOCAL_STORAGE_CUENTAS);
  return local ? JSON.parse(local) : [];
};

// Guarda en localStorage las cuotas simuladas
const saveLocalCuentas = (cuentas: CuentaCobrarDetalle[]) => {
  localStorage.setItem(LOCAL_STORAGE_CUENTAS, JSON.stringify(cuentas));
};

/**
 * SIMULACIÓN DEL TRIGGER DE POSTGRESQL EN EL FRONTEND
 * Genera automáticamente registros de cuotas en cuentas_cobrar basándose en el plazo y tipo de documento.
 * Guarda los resultados formateados en la estructura de la vista v_cuentas_cobrar_detalle.
 */
export const simulateCuentasCobrarTrigger = (venta: Venta) => {
  const cliente = MOCK_CLIENTES.find(c => c.id === venta.cliente_id)?.ruc || `Cliente #${venta.cliente_id}`;
  const monedaObj = MOCK_MONEDAS.find(m => m.id === venta.moneda_id);
  const monedaDesc = monedaObj?.descripcion || 'Guaraníes';
  const monedaAbrev = monedaObj?.abreviatura || 'PYG';
  const plazoObj = MOCK_PLAZOS.find(p => p.id === venta.plazo_id);
  const plazoDesc = plazoObj?.plazo || `Plazo #${venta.plazo_id}`;
  
  const cuotasGeneradas: CuentaCobrarDetalle[] = [];
  const existingCuentas = getLocalCuentas().filter(c => c.venta_id !== venta.id); // Evitar duplicados si re-guardamos
  
  let totalImportes = 0;
  
  // Reglas del trigger según el tipo de plazo
  if (venta.plazo_id === 1) {
    // Contado: 1 cuota
    const cuota: CuentaCobrarDetalle = {
      cuenta_id: Number(`200${venta.id}1`),
      venta_id: venta.id,
      fecha_proceso: venta.fecha_proceso,
      fecha_factura: venta.fecha_factura,
      factura: formatInvoice(venta.serie, venta.nro_factura),
      timbrado: venta.timbrado,
      total_factura: venta.total_factura,
      cliente_id: venta.cliente_id,
      cliente: cliente,
      moneda: monedaDesc,
      moneda_abreviatura: monedaAbrev,
      plazo: plazoDesc,
      cuotas: 1,
      cuota: 1,
      cuota_texto: '1/1',
      importe: venta.total_factura,
      vence: venta.fecha_factura, // cancela en la misma fecha
      cobrado: 0,
      saldo: venta.total_factura,
      estado: 'PENDIENTE'
    };
    cuotasGeneradas.push(cuota);
  } 
  else if (venta.plazo_id === 2) {
    // Crédito 30 días: 1 cuota a 30 días
    const cuota: CuentaCobrarDetalle = {
      cuenta_id: Number(`200${venta.id}1`),
      venta_id: venta.id,
      fecha_proceso: venta.fecha_proceso,
      fecha_factura: venta.fecha_factura,
      factura: formatInvoice(venta.serie, venta.nro_factura),
      timbrado: venta.timbrado,
      total_factura: venta.total_factura,
      cliente_id: venta.cliente_id,
      cliente: cliente,
      moneda: monedaDesc,
      moneda_abreviatura: monedaAbrev,
      plazo: plazoDesc,
      cuotas: 1,
      cuota: 1,
      cuota_texto: '1/1',
      importe: venta.total_factura,
      vence: addDays(venta.fecha_factura, 30),
      cobrado: 0,
      saldo: venta.total_factura,
      estado: 'PENDIENTE'
    };
    cuotasGeneradas.push(cuota);
  }
  else if (venta.plazo_id === 3) {
    // Crédito Regular: 3 cuotas a 30/60/90 días
    const numCuotas = 3;
    const importePorCuota = Math.round(venta.total_factura / numCuotas);
    
    for (let c = 1; c <= numCuotas; c++) {
      // Ajustar redondeo en la última cuota
      const importeFinal = c === numCuotas ? (venta.total_factura - totalImportes) : importePorCuota;
      totalImportes += importeFinal;
      
      const cuota: CuentaCobrarDetalle = {
        cuenta_id: Number(`200${venta.id}${c}`),
        venta_id: venta.id,
        fecha_proceso: venta.fecha_proceso,
        fecha_factura: venta.fecha_factura,
        factura: formatInvoice(venta.serie, venta.nro_factura),
        timbrado: venta.timbrado,
        total_factura: venta.total_factura,
        cliente_id: venta.cliente_id,
        cliente: cliente,
        moneda: monedaDesc,
        moneda_abreviatura: monedaAbrev,
        plazo: plazoDesc,
        cuotas: numCuotas,
        cuota: c,
        cuota_texto: `${c}/${numCuotas}`,
        importe: importeFinal,
        vence: addDays(venta.fecha_factura, c * 30),
        cobrado: 0,
        saldo: importeFinal,
        estado: 'PENDIENTE'
      };
      cuotasGeneradas.push(cuota);
    }
  }
  else if (venta.plazo_id === 4) {
    // Crédito Irregular: 2 cuotas a 45 y 75 días
    // Simulemos un porcentaje irregular: 45% primera cuota, 55% segunda cuota
    const numCuotas = 2;
    const porcentajes = [0.45, 0.55];
    const vencimientos = [45, 75];
    
    for (let c = 1; c <= numCuotas; c++) {
      const importeFinal = c === numCuotas 
        ? (venta.total_factura - totalImportes) 
        : Math.round(venta.total_factura * porcentajes[c - 1]);
      totalImportes += importeFinal;
      
      const cuota: CuentaCobrarDetalle = {
        cuenta_id: Number(`200${venta.id}${c}`),
        venta_id: venta.id,
        fecha_proceso: venta.fecha_proceso,
        fecha_factura: venta.fecha_factura,
        factura: formatInvoice(venta.serie, venta.nro_factura),
        timbrado: venta.timbrado,
        total_factura: venta.total_factura,
        cliente_id: venta.cliente_id,
        cliente: cliente,
        moneda: monedaDesc,
        moneda_abreviatura: monedaAbrev,
        plazo: plazoDesc,
        cuotas: numCuotas,
        cuota: c,
        cuota_texto: `${c}/${numCuotas}`,
        importe: importeFinal,
        vence: addDays(venta.fecha_factura, vencimientos[c - 1]),
        cobrado: 0,
        saldo: importeFinal,
        estado: 'PENDIENTE'
      };
      cuotasGeneradas.push(cuota);
    }
  } else {
    // Fallback genérico: 1 cuota vencimiento regular
    const cuota: CuentaCobrarDetalle = {
      cuenta_id: Number(`200${venta.id}1`),
      venta_id: venta.id,
      fecha_proceso: venta.fecha_proceso,
      fecha_factura: venta.fecha_factura,
      factura: formatInvoice(venta.serie, venta.nro_factura),
      timbrado: venta.timbrado,
      total_factura: venta.total_factura,
      cliente_id: venta.cliente_id,
      cliente: cliente,
      moneda: monedaDesc,
      moneda_abreviatura: monedaAbrev,
      plazo: plazoDesc,
      cuotas: 1,
      cuota: 1,
      cuota_texto: '1/1',
      importe: venta.total_factura,
      vence: addDays(venta.fecha_factura, 30),
      cobrado: 0,
      saldo: venta.total_factura,
      estado: 'PENDIENTE'
    };
    cuotasGeneradas.push(cuota);
  }
  
  // Guardar en la base de datos local simulada
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
      
      // Si la base local de cuotas está vacía, la poblamos simulando el trigger con las ventas cargadas
      const localCuentas = getLocalCuentas();
      if (localCuentas.length === 0) {
        const local = localStorage.getItem('gqg_ventas_db');
        if (local) {
          const ventas: Venta[] = JSON.parse(local);
          ventas.forEach(v => simulateCuentasCobrarTrigger(v));
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
        .filter(c => c.venta_id === ventaId)
        .sort((a, b) => a.cuota - b.cuota);
    }
  },

  // Simulación para permitir cobrar una cuota de forma offline
  async registrarCobroOffline(cuentaId: number, montoACobrar: number): Promise<CuentaCobrarDetalle | null> {
    const cuentas = getLocalCuentas();
    const index = cuentas.findIndex(c => c.cuenta_id === cuentaId);
    
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
