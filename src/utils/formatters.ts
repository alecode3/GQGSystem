/**
 * Formatea un valor numérico a formato de moneda local.
 * Soporta PYG (Guaraníes sin decimales) y otras monedas con 2 decimales (ej. USD).
 */
export const formatCurrency = (value: number, monedaAbreviatura: string = 'PYG'): string => {
  const isPyg = monedaAbreviatura.toUpperCase() === 'PYG' || monedaAbreviatura.toUpperCase() === 'GS';
  
  try {
    return new Intl.NumberFormat(isPyg ? 'es-PY' : 'en-US', {
      style: 'currency',
      currency: isPyg ? 'PYG' : (monedaAbreviatura || 'USD'),
      minimumFractionDigits: isPyg ? 0 : 2,
      maximumFractionDigits: isPyg ? 0 : 2,
    }).format(value);
  } catch (e) {
    // Fallback simple si la abreviatura de moneda no es soportada por Intl
    const formattedNum = value.toLocaleString(isPyg ? 'es-PY' : 'en-US', {
      minimumFractionDigits: isPyg ? 0 : 2,
      maximumFractionDigits: isPyg ? 0 : 2,
    });
    return `${monedaAbreviatura} ${formattedNum}`;
  }
};

/**
 * Formatea la serie y el número de factura a la máscara estándar de Paraguay: XXX-XXX-XXXXXXX
 * Ejemplo: serie = "001-001", nroFactura = 123 -> "001-001-0000123"
 */
export const formatInvoice = (serie: string, nroFactura: number | string): string => {
  const cleanSerie = (serie || '001-001').trim();
  const cleanNro = String(nroFactura || '0').trim();
  const paddedNro = cleanNro.padStart(7, '0');
  
  // Si la serie ya incluye guiones, se usa tal cual, de lo contrario se asume
  return `${cleanSerie}-${paddedNro}`;
};

/**
 * Retorna el nombre ficticio o académico de una entidad (cliente o proveedor) dado su RUC.
 */
export const getEntidadNombreByRuc = (ruc: string): string => {
  const cleanRuc = (ruc || '').trim();
  // Clientes
  if (cleanRuc === '3419776-0' || cleanRuc.includes('3419776')) return 'Gregorio Quintana González';
  if (cleanRuc === '80012345-6' || cleanRuc.includes('80012345')) return 'GQG System S.A.';
  if (cleanRuc === '80054321-0' || cleanRuc.includes('80054321')) return 'Distribuidora Oriental S.R.L.';
  if (cleanRuc === '80098765-4' || cleanRuc.includes('80098765')) return 'Comercial El Trébol S.A.';
  if (cleanRuc === '3456789-2' || cleanRuc.includes('3456789')) return 'Juan Pérez';
  if (cleanRuc === '80112233-9' || cleanRuc.includes('80112233')) return 'Supermercado Central';
  
  // Proveedores
  if (cleanRuc === '90012345-0' || cleanRuc.includes('90012345')) return 'Importadora Artigas S.A.';
  if (cleanRuc === '90054321-1' || cleanRuc.includes('90054321')) return 'Distribuidora Oriental Proveedores';
  if (cleanRuc === '90098765-2' || cleanRuc.includes('90098765')) return 'Importadora del Sur S.A.';
  
  return ruc; // Por defecto retorna el RUC
};

export const getClienteNombreByRuc = getEntidadNombreByRuc;


