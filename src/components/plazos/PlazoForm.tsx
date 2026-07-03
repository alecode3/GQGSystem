import React, { useState, useEffect } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Plazo, PlazoDetalle, TipoDocumento } from '../../types/database';
import { NuevoPlazoPayload, NuevoPlazoDetallePayload } from '../../services/plazosService';
import { Save, X, CalendarDays } from 'lucide-react';

interface PlazoFormProps {
  initialPlazo?: Plazo;
  initialDetalles?: PlazoDetalle[];
  tiposDoc: TipoDocumento[];
  onSave: (plazo: NuevoPlazoPayload, detalles: Omit<NuevoPlazoDetallePayload, 'plazo_id'>[]) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export const PlazoForm: React.FC<PlazoFormProps> = ({
  initialPlazo,
  initialDetalles = [],
  tiposDoc,
  onSave,
  onCancel,
  isLoading
}) => {
  const [plazo, setPlazo] = useState(initialPlazo?.plazo || '');
  const [tipoId, setTipoId] = useState(initialPlazo?.tipo_id?.toString() || '');
  const [cuotas, setCuotas] = useState(initialPlazo?.cuotas || 1);
  const [irregular, setIrregular] = useState(initialPlazo?.irregular || false);
  const [activo, setActivo] = useState(initialPlazo ? initialPlazo.activo : true);
  
  // Array para almacenar los días de cada cuota si es irregular
  const [diasPorCuota, setDiasPorCuota] = useState<{cuota: number, dias: number}[]>([]);

  // Inicializar detalles si se está editando
  useEffect(() => {
    if (initialDetalles.length > 0) {
      setDiasPorCuota(initialDetalles.map(d => ({ cuota: d.cuota, dias: d.dias })));
    } else if (irregular && cuotas > 0) {
      // Si se cambia a irregular y no hay detalles, inicializar array
      const nuevos = Array.from({ length: cuotas }, (_, i) => ({
        cuota: i + 1,
        dias: (i + 1) * 30
      }));
      setDiasPorCuota(nuevos);
    }
  }, [initialDetalles, irregular, cuotas]);

  // Manejar cambio en cantidad de cuotas (solo si es irregular para ajustar el array de detalles)
  const handleCuotasChange = (val: number) => {
    const value = Math.max(1, val);
    setCuotas(value);
    
    if (irregular) {
      setDiasPorCuota(prev => {
        const newArr = [...prev];
        if (value > prev.length) {
          // Agregar nuevas cuotas
          for (let i = prev.length; i < value; i++) {
            newArr.push({ cuota: i + 1, dias: (i + 1) * 30 });
          }
        } else if (value < prev.length) {
          // Quitar cuotas sobrantes
          newArr.length = value;
        }
        return newArr;
      });
    }
  };

  const handleDiaChange = (cuota: number, dias: number) => {
    setDiasPorCuota(prev => prev.map(d => d.cuota === cuota ? { ...d, dias: Math.max(0, dias) } : d));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload: NuevoPlazoPayload = {
      plazo,
      tipo_id: Number(tipoId),
      cuotas,
      irregular,
      activo
    };

    const detalles = irregular ? diasPorCuota.map(d => ({ cuota: d.cuota, dias: d.dias })) : [];

    await onSave(payload, detalles);
  };

  return (
    <div className="gqg-panel overflow-hidden shadow-xl">
      <div className="bg-slate-50 px-6 py-4 border-b-2 border-slate-300 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-brand-600" />
          {initialPlazo ? 'Editar Plazo' : 'Nuevo Plazo'}
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Descripción del Plazo"
            placeholder="Ej: Crédito 30/60/90 días"
            value={plazo}
            onChange={(e) => setPlazo(e.target.value)}
            required
          />
          
          <Select
            label="Tipo de Documento"
            value={tipoId}
            onChange={(e) => setTipoId(e.target.value)}
            required
            options={[
              { value: '', label: 'Seleccione un tipo...' },
              ...tiposDoc.map(t => ({ value: t.id, label: t.descripcion }))
            ]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Input
            label="Cantidad de Cuotas"
            type="number"
            min="1"
            value={cuotas}
            onChange={(e) => handleCuotasChange(Number(e.target.value))}
            required
          />
          
          <div className="flex items-center gap-2 h-11 px-3 border-2 border-slate-300 rounded-lg bg-slate-50 shadow-sm">
            <input
              type="checkbox"
              id="irregular"
              checked={irregular}
              onChange={(e) => {
                setIrregular(e.target.checked);
                if (e.target.checked) handleCuotasChange(cuotas); // Forzar inicialización
              }}
              className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
            />
            <label htmlFor="irregular" className="text-sm font-medium text-slate-700 cursor-pointer">
              Es Irregular (días personalizados)
            </label>
          </div>

          <div className="flex items-center gap-2 h-11 px-3 border-2 border-slate-300 rounded-lg bg-slate-50 shadow-sm">
            <input
              type="checkbox"
              id="activo"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <label htmlFor="activo" className="text-sm font-medium text-slate-700 cursor-pointer">
              Plazo Activo
            </label>
          </div>
        </div>

        {/* Sección Dinámica para Cuotas Irregulares */}
        {irregular && (
          <div className="mt-6 p-4 bg-brand-50 rounded-xl border-2 border-brand-200 shadow-md">
            <h4 className="text-sm font-bold text-brand-800 mb-3 uppercase tracking-wider">
              Configuración de Días por Cuota
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {diasPorCuota.map((detalle, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg border-2 border-brand-300 shadow-md shadow-brand-100/80 relative">
                  <span className="absolute -top-2 -left-2 bg-brand-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                    {detalle.cuota}
                  </span>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Días de Venc.</label>
                  <input
                    type="number"
                    min="0"
                    value={detalle.dias}
                    onChange={(e) => handleDiaChange(detalle.cuota, Number(e.target.value))}
                    className="w-full text-lg font-bold text-brand-700 border-none bg-transparent p-0 focus:ring-0"
                    required
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-brand-600 mt-3 font-medium">
              Especifique los días que transcurrirán desde la fecha de factura para el vencimiento de cada cuota.
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Guardar Plazo
          </Button>
        </div>
      </form>
    </div>
  );
};
