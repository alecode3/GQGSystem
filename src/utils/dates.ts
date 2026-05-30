/**
 * Formatea una fecha string (ej. "2026-05-30" o ISO) a formato local "DD/MM/AAAA".
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  
  try {
    // Intentar formatear ignorando problemas de zona horaria (dividiendo por guión)
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('es-PY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC' // Usamos UTC para evitar desfasaje de zona horaria local
    });
  } catch (e) {
    return dateString;
  }
};

/**
 * Retorna la fecha actual formateada en "AAAA-MM-DD" para inputs de tipo fecha.
 */
export const getCurrentDateString = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Suma días a una fecha y retorna en formato "AAAA-MM-DD".
 */
export const addDays = (dateString: string, days: number): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  date.setDate(date.getDate() + days);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
