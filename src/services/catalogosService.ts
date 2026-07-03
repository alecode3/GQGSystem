import { supabase } from './supabaseClient';
import { Cliente, Proveedor, Moneda, Deposito, TipoDocumento, Plazo, PlazoDetalle } from '../types/catalogos';

// MOCK DATA DE RESPALDO (En caso de que falle la conexión a Supabase)
export const MOCK_CLIENTES: Cliente[] = [
  { id: 1, ruc: '80012345-6', direccion: 'Av. España 1450, Asunción', telefono: '021-600700', activo: true },
  { id: 2, ruc: '80054321-0', direccion: 'Ruta 7 Km 4, Ciudad del Este', telefono: '061-500600', activo: true },
  { id: 3, ruc: '80098765-4', direccion: 'Mariscal Estigarribia 450, Encarnación', telefono: '071-400300', activo: true },
  { id: 4, ruc: '3456789-2', direccion: 'Gral. Aquino 980, Luque', telefono: '021-645312', activo: true },
  { id: 5, ruc: '80112233-9', direccion: 'Mcal. López e Insaurralde, Fernando de la Mora', telefono: '021-505808', activo: true }
];

export const MOCK_PROVEEDORES: Proveedor[] = [
  { id: 1, ruc: '90012345-0', direccion: 'Av. Artigas 1200, Asunción', telefono: '021-200300', activo: true },
  { id: 2, ruc: '90054321-1', direccion: 'Av. Monseñor Rodríguez, CDE', telefono: '061-600100', activo: true },
  { id: 3, ruc: '90098765-2', direccion: 'Ruta 1 Km 2, Encarnación', telefono: '071-300400', activo: true }
];

export const MOCK_MONEDAS: Moneda[] = [
  { id: 1, descripcion: 'Guaraníes', abreviatura: 'PYG', simbolo: 'Gs.', activo: true },
  { id: 2, descripcion: 'Dólares Americanos', abreviatura: 'USD', simbolo: 'US$', activo: true }
];

export const MOCK_DEPOSITOS: Deposito[] = [
  { id: 1, descripcion: 'Depósito Central (Asunción)', activo: true },
  { id: 2, descripcion: 'Depósito Ciudad del Este', activo: true },
  { id: 3, descripcion: 'Depósito Encarnación', activo: true }
];

export const MOCK_TIPOS_DOCUMENTO: TipoDocumento[] = [
  { id: 1, descripcion: 'Contado', codigo: 'CO', activo: true },
  { id: 2, descripcion: 'Crédito', codigo: 'CR', activo: true }
];

export const MOCK_PLAZOS: Plazo[] = [
  { id: 1, plazo: 'Contado - 0 días', tipo_id: 1, cuotas: 1, irregular: false, activo: true },
  { id: 2, plazo: 'Crédito - 30 días', tipo_id: 2, cuotas: 1, irregular: false, activo: true },
  { id: 3, plazo: 'Crédito Regular - 30/60/90 días', tipo_id: 2, cuotas: 3, irregular: false, activo: true },
  { id: 4, plazo: 'Crédito Irregular - 45/75 días', tipo_id: 2, cuotas: 2, irregular: true, activo: true },
  { id: 5, plazo: 'Crédito Irregular - 30/45/60 días', tipo_id: 2, cuotas: 3, irregular: true, activo: true }
];

export const MOCK_PLAZO_DETALLES: PlazoDetalle[] = [
  { id: 1, plazo_id: 4, cuota: 1, dias: 45 },
  { id: 2, plazo_id: 4, cuota: 2, dias: 75 },
  { id: 3, plazo_id: 5, cuota: 1, dias: 30 },
  { id: 4, plazo_id: 5, cuota: 2, dias: 45 },
  { id: 5, plazo_id: 5, cuota: 3, dias: 60 }
];

export const catalogosService = {
  async getClientes(): Promise<Cliente[]> {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('ruc');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Falla al cargar clientes de Supabase. Usando mock data.', error);
      return MOCK_CLIENTES;
    }
  },

  async getProveedores(): Promise<Proveedor[]> {
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .order('ruc');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Falla al cargar proveedores de Supabase. Usando mock data.', error);
      return MOCK_PROVEEDORES;
    }
  },

  async getMonedas(): Promise<Moneda[]> {
    try {
      const { data, error } = await supabase
        .from('monedas')
        .select('*')
        .order('id');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Falla al cargar monedas de Supabase. Usando mock data.', error);
      return MOCK_MONEDAS;
    }
  },

  async getDepositos(): Promise<Deposito[]> {
    try {
      const { data, error } = await supabase
        .from('depositos')
        .select('*')
        .order('descripcion');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Falla al cargar depósitos de Supabase. Usando mock data.', error);
      return MOCK_DEPOSITOS;
    }
  },

  async getTiposDocumento(): Promise<TipoDocumento[]> {
    try {
      const { data, error } = await supabase
        .from('tipos_documento')
        .select('*')
        .order('id');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Falla al cargar tipos de documento de Supabase. Usando mock data.', error);
      return MOCK_TIPOS_DOCUMENTO;
    }
  },

  async getPlazos(): Promise<Plazo[]> {
    try {
      const { data, error } = await supabase
        .from('plazos')
        .select('*')
        .order('id');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Falla al cargar plazos de Supabase. Usando mock data.', error);
      return MOCK_PLAZOS;
    }
  },

  async getPlazoDetalles(plazoId: number): Promise<PlazoDetalle[]> {
    try {
      const { data, error } = await supabase
        .from('plazo_detalles')
        .select('*')
        .eq('plazo_id', plazoId)
        .order('cuota');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn(`Falla al cargar detalles del plazo ${plazoId}. Usando mock data.`, error);
      return MOCK_PLAZO_DETALLES.filter((d) => d.plazo_id === plazoId);
    }
  }
};

