import { supabase } from './supabaseClient';
import { Venta, NuevaVentaPayload } from '../types/venta';
import { simulateCuentasCobrarTrigger } from './cuentasCobrarService';

// Clave para guardar en localStorage
const LOCAL_STORAGE_VENTAS = 'gqg_ventas_db';

// Ventas por defecto para el sistema offline/sin Supabase
const INITIAL_MOCK_VENTAS: Venta[] = [
  {
    id: 101,
    fecha_proceso: '2026-05-28T10:00:00Z',
    fecha_factura: '2026-05-28',
    cliente_id: 1, // GQG System S.A.
    serie: '001-001',
    nro_factura: 4520,
    timbrado: '12345678',
    timbrado_vence: '2027-05-30',
    total_exento: 0,
    total_impuesto: 150000,
    total_base: 1500000,
    total_factura: 1650000,
    deposito_id: 1,
    moneda_id: 1, // PYG
    tipo_doc_id: 1, // Contado
    plazo_id: 1 // Contado - 0 días
  },
  {
    id: 102,
    fecha_proceso: '2026-05-29T14:30:00Z',
    fecha_factura: '2026-05-29',
    cliente_id: 2, // Distribuidora Oriental S.R.L.
    serie: '001-001',
    nro_factura: 4521,
    timbrado: '12345678',
    timbrado_vence: '2027-05-30',
    total_exento: 0,
    total_impuesto: 300000,
    total_base: 3000000,
    total_factura: 3300000,
    deposito_id: 2,
    moneda_id: 1, // PYG
    tipo_doc_id: 2, // Crédito
    plazo_id: 3 // Crédito Regular - 30/60/90 días
  },
  {
    id: 103,
    fecha_proceso: '2026-05-30T09:15:00Z',
    fecha_factura: '2026-05-30',
    cliente_id: 3, // Comercial El Trébol S.A.
    serie: '002-001',
    nro_factura: 890,
    timbrado: '87654321',
    timbrado_vence: '2026-12-31',
    total_exento: 100, // 100 USD exento (ejemplo en dólares)
    total_impuesto: 45,
    total_base: 450,
    total_factura: 595,
    deposito_id: 1,
    moneda_id: 2, // USD
    tipo_doc_id: 2, // Crédito
    plazo_id: 4 // Crédito Irregular - 45/75 días
  }
];

// Inicializa las ventas de mock en localStorage si no existen
const getLocalVentas = (): Venta[] => {
  const local = localStorage.getItem(LOCAL_STORAGE_VENTAS);
  if (!local) {
    localStorage.setItem(LOCAL_STORAGE_VENTAS, JSON.stringify(INITIAL_MOCK_VENTAS));
    
    // Al inicializar las ventas por primera vez, simular el trigger para cada una de ellas
    INITIAL_MOCK_VENTAS.forEach(venta => {
      simulateCuentasCobrarTrigger(venta);
    });
    
    return INITIAL_MOCK_VENTAS;
  }
  return JSON.parse(local);
};

const saveLocalVenta = (venta: Venta) => {
  const ventas = getLocalVentas();
  ventas.push(venta);
  localStorage.setItem(LOCAL_STORAGE_VENTAS, JSON.stringify(ventas));
  
  // Simular el trigger de la base de datos para generar cuotas correspondientes
  simulateCuentasCobrarTrigger(venta);
};

export const ventasService = {
  async getVentas(): Promise<Venta[]> {
    try {
      // Intentar consultar Supabase
      const { data, error } = await supabase
        .from('ventas')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Falla al consultar ventas de Supabase. Usando base de datos simulada en localStorage.', error);
      return getLocalVentas().slice().reverse(); // Devolver ordenadas por id descendente
    }
  },

  async getVentaById(id: number): Promise<Venta | null> {
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn(`Falla al consultar venta ${id} de Supabase. Buscando en localStorage.`, error);
      const ventas = getLocalVentas();
      return ventas.find(v => v.id === id) || null;
    }
  },

  async getSiguienteNroFactura(serie: string = '001-001'): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select('nro_factura')
        .eq('serie', serie)
        .order('nro_factura', { ascending: false })
        .limit(1);

      if (error) throw error;
      const maxNro = data?.[0]?.nro_factura ?? 44685;
      return maxNro + 1;
    } catch (error) {
      console.warn('Falla al obtener siguiente nro de factura. Usando localStorage.', error);
      const ventas = getLocalVentas().filter(v => v.serie === serie);
      const maxNro = ventas.reduce((max, v) => (v.nro_factura > max ? v.nro_factura : max), 44685);
      return maxNro + 1;
    }
  },

  async createVenta(payload: NuevaVentaPayload): Promise<Venta> {
    try {
      // Intentar insertar en Supabase
      const { data, error } = await supabase
        .from('ventas')
        .insert([payload])
        .select()
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('No se recibió confirmación del registro insertado.');
      return data;
    } catch (error: any) {
      console.warn('Falla al insertar venta en Supabase. Registrando en base de datos simulada.', error);
      
      // Manejo específico del error de plazo incompatible (para simular el trigger de rechazo)
      if (payload.tipo_doc_id === 1 && payload.plazo_id !== 1) {
        throw new Error('Error de negocio: Ventas al contado deben tener plazos exclusivos de contado (0 días). Transacción rechazada por el trigger.');
      }
      if (payload.tipo_doc_id === 2 && payload.plazo_id === 1) {
        throw new Error('Error de negocio: Ventas a crédito no pueden registrarse con plazos de contado. Transacción rechazada por el trigger.');
      }

      // Generar una ID secuencial
      const localVentas = getLocalVentas();
      const nextId = localVentas.reduce((max, v) => v.id > max ? v.id : max, 0) + 1;
      
      const nuevaVenta: Venta = {
        ...payload,
        id: nextId,
        fecha_proceso: new Date().toISOString()
      };
      
      saveLocalVenta(nuevaVenta);
      return nuevaVenta;
    }
  }
};
