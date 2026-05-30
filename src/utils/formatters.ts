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
