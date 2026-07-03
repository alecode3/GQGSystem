import { Plazo, PlazoDetalle, TipoDocumento } from '../types/database';
import { addDays } from './dates';

export interface CuotaPreviewRow {
  cuota: number;
  cuota_texto: string;
  importe: number;
  vence: string;
  cobrado: number;
}

/**
 * Replica la lógica del trigger PostgreSQL para previsualizar cuotas
 * antes de confirmar una venta o compra.
 */
export const calcularCuotasPreview = (
  fechaFactura: string,
  totalFactura: number,
  tipoDoc: TipoDocumento | undefined,
  plazo: Plazo | undefined,
  plazoDetalles: PlazoDetalle[] = []
): CuotaPreviewRow[] => {
  if (!tipoDoc || !plazo || totalFactura <= 0 || !fechaFactura) {
    return [];
  }

  if (tipoDoc.codigo === 'CO') {
    return [{
      cuota: 1,
      cuota_texto: '1/1',
      importe: totalFactura,
      vence: fechaFactura,
      cobrado: 0
    }];
  }

  const numCuotas = plazo.cuotas;
  const importeCuota = Math.round((totalFactura / numCuotas) * 100) / 100;
  let acumulado = 0;
  const rows: CuotaPreviewRow[] = [];

  if (!plazo.irregular) {
    for (let i = 1; i <= numCuotas; i++) {
      const importeFinal = i < numCuotas
        ? importeCuota
        : Math.round((totalFactura - acumulado) * 100) / 100;
      acumulado += importeFinal;

      rows.push({
        cuota: i,
        cuota_texto: `${i}/${numCuotas}`,
        importe: importeFinal,
        vence: addDays(fechaFactura, i * 30),
        cobrado: 0
      });
    }
    return rows;
  }

  const detallesOrdenados = [...plazoDetalles].sort((a, b) => a.cuota - b.cuota);
  if (detallesOrdenados.length === 0) {
    return [];
  }

  detallesOrdenados.forEach((detalle, index) => {
    const esUltima = index === detallesOrdenados.length - 1;
    const importeFinal = esUltima
      ? Math.round((totalFactura - acumulado) * 100) / 100
      : importeCuota;
    acumulado += importeFinal;

    rows.push({
      cuota: detalle.cuota,
      cuota_texto: `${detalle.cuota}/${numCuotas}`,
      importe: importeFinal,
      vence: addDays(fechaFactura, detalle.dias),
      cobrado: 0
    });
  });

  return rows;
};

/** Etiqueta legible del plan de cuotas (ej. CR-30-45-60 días). */
export const buildPlanCuotasLabel = (
  plazo: Plazo | undefined,
  tipoDoc: TipoDocumento | undefined,
  plazoDetalles: PlazoDetalle[] = []
): string => {
  if (!plazo || !tipoDoc) return '-';

  if (tipoDoc.codigo === 'CO') {
    return 'CO - Contado (0 días)';
  }

  if (plazo.irregular && plazoDetalles.length > 0) {
    const dias = [...plazoDetalles]
      .sort((a, b) => a.cuota - b.cuota)
      .map((d) => d.dias)
      .join('-');
    return `${tipoDoc.codigo}-${dias} días`;
  }

  if (!plazo.irregular && plazo.cuotas > 1) {
    const dias = Array.from({ length: plazo.cuotas }, (_, i) => (i + 1) * 30).join('-');
    return `${tipoDoc.codigo}-${dias} días`;
  }

  return plazo.plazo;
};

export const findTipoByCodigo = (tipos: TipoDocumento[], codigo: 'CO' | 'CR') =>
  tipos.find((t) => t.codigo === codigo);

export const findPlazoContado = (plazos: Plazo[], tipoContadoId: number) =>
  plazos.find((p) => p.tipo_id === tipoContadoId && !p.irregular && p.cuotas === 1);
