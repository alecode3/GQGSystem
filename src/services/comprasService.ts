import { supabase } from './supabaseClient';
import { Compra, NuevaCompraPayload } from '../types/compra';
import { simulateCuentasPagarTrigger } from './cuentasPagarService';

// Clave para guardar en localStorage
const LOCAL_STORAGE_COMPRAS = 'gqg_compras_db';

// Compras por defecto para el sistema offline/sin Supabase
const INITIAL_MOCK_COMPRAS: Compra[] = [
  {
    id: 101,
    fecha_proceso: '2026-05-28T10:00:00Z',
    fecha_factura: '2026-05-28',
    proveedor_id: 1, // Proveedor Tecnológico del Paraguay S.A.
    serie: '001-001',
    nro_factura: 1024,
    timbrado: '87654321',
    timbrado_vence: '2027-05-30',
    total_exento: 0,
    total_impuesto: 200000,
    total_base: 2000000,
    total_factura: 2200000,
    deposito_id: 1,
    moneda_id: 1, // PYG
    tipo_doc_id: 1, // Contado
    plazo_id: 1 // Contado - 0 días
  },
  {
    id: 102,
    fecha_proceso: '2026-05-29T14:30:00Z',
    fecha_factura: '2026-05-29',
    proveedor_id: 2, // Distribuidora Mayorista del Este
    serie: '002-001',
    nro_factura: 8970,
    timbrado: '12345678',
    timbrado_vence: '2027-05-30',
    total_exento: 0,
    total_impuesto: 500000,
    total_base: 5000000,
    total_factura: 5500000,
    deposito_id: 2,
    moneda_id: 1, // PYG
    tipo_doc_id: 2, // Crédito
    plazo_id: 3 // Crédito Regular - 30/60/90 días
  }
];

// Inicializa las compras de mock en localStorage si no existen
const getLocalCompras = (): Compra[] => {
  const local = localStorage.getItem(LOCAL_STORAGE_COMPRAS);
  if (!local) {
    localStorage.setItem(LOCAL_STORAGE_COMPRAS, JSON.stringify(INITIAL_MOCK_COMPRAS));
    
    // Al inicializar las compras por primera vez, simular el trigger para cada una de ellas
    INITIAL_MOCK_COMPRAS.forEach(compra => {
      simulateCuentasPagarTrigger(compra);
    });
    
    return INITIAL_MOCK_COMPRAS;
  }
  return JSON.parse(local);
};

const saveLocalCompra = (compra: Compra) => {
  const compras = getLocalCompras();
  compras.push(compra);
  localStorage.setItem(LOCAL_STORAGE_COMPRAS, JSON.stringify(compras));
  
  // Simular el trigger de la base de datos para generar cuotas correspondientes
  simulateCuentasPagarTrigger(compra);
};

export const comprasService = {
  async getCompras(): Promise<Compra[]> {
    try {
      // Intentar consultar Supabase
      const { data, error } = await supabase
        .from('compras')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Falla al consultar compras de Supabase. Usando base de datos simulada en localStorage.', error);
      return getLocalCompras().slice().reverse(); // Devolver ordenadas por id descendente
    }
  },

  async getCompraById(id: number): Promise<Compra | null> {
    try {
      const { data, error } = await supabase
        .from('compras')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn(`Falla al consultar compra ${id} de Supabase. Buscando en localStorage.`, error);
      const compras = getLocalCompras();
      return compras.find(c => c.id === id) || null;
    }
  },

  async createCompra(payload: NuevaCompraPayload): Promise<Compra> {
    try {
      // Intentar insertar en Supabase
      const { data, error } = await supabase
        .from('compras')
        .insert([payload])
        .select()
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('No se recibió confirmación del registro insertado.');
      return data;
    } catch (error: any) {
      console.warn('Falla al insertar compra en Supabase. Registrando en base de datos simulada.', error);
      
      // Manejo específico del error de plazo incompatible (para simular el trigger de rechazo)
      if (payload.tipo_doc_id === 1 && payload.plazo_id !== 1) {
        throw new Error('Error de negocio: Compras al contado deben tener plazos exclusivos de contado (0 días). Transacción rechazada por el trigger.');
      }
      if (payload.tipo_doc_id === 2 && payload.plazo_id === 1) {
        throw new Error('Error de negocio: Compras a crédito no pueden registrarse con plazos de contado. Transacción rechazada por el trigger.');
      }

      // Generar una ID secuencial
      const localCompras = getLocalCompras();
      const nextId = localCompras.reduce((max, c) => c.id > max ? c.id : max, 0) + 1;
      
      const nuevaCompra: Compra = {
        ...payload,
        id: nextId,
        fecha_proceso: new Date().toISOString()
      };
      
      saveLocalCompra(nuevaCompra);
      return nuevaCompra;
    }
  }
};
