export interface TipoDocumento {
  id: number;
  descripcion: string;
  codigo: 'CO' | 'CR' | string; // CO = Contado, CR = Crédito
  activo: boolean;
}

export interface Moneda {
  id: number;
  descripcion: string;
  abreviatura: string;
  simbolo: string;
  activo: boolean;
}

export interface Cliente {
  id: number;
  razon_social: string;
  ruc: string;
  direccion?: string;
  telefono?: string;
  activo: boolean;
}

export interface Deposito {
  id: number;
  descripcion: string;
  activo: boolean;
}

export interface Plazo {
  id: number;
  plazo: string;
  tipo_id: number;
  cuotas: number;
  irregular: boolean;
  activo: boolean;
}

export interface PlazoDetalle {
  id: number;
  plazo_id: number;
  cuota: number;
  dias: number;
}

export interface Venta {
  id: number;
  fecha_proceso: string;
  fecha_factura: string;
  cliente_id: number;
  serie: string;
  nro_factura: number;
  timbrado: string;
  timbrado_vence: string;
  total_exento: number;
  total_impuesto: number;
  total_base: number;
  total_factura: number;
  deposito_id: number;
  moneda_id: number;
  tipo_doc_id: number;
  plazo_id: number;
}

export interface CuentaCobrar {
  id: number;
  venta_id: number;
  nro_cuota: number;
  importe: number;
  vence: string;
  cobrado: number;
  saldo: number;
  estado: 'PENDIENTE' | 'COBRADO' | string;
}

export interface CuentaCobrarDetalle {
  cuenta_id: number;
  venta_id: number;
  fecha_proceso: string;
  fecha_factura: string;
  factura: string;
  timbrado: string;
  total_factura: number;
  cliente_id: number;
  cliente: string;
  moneda: string;
  moneda_abreviatura: string;
  plazo: string;
  cuotas: number;
  cuota: number;
  cuota_texto: string;
  importe: number;
  vence: string;
  cobrado: number;
  saldo: number;
  estado: 'PENDIENTE' | 'COBRADO' | string;
}
