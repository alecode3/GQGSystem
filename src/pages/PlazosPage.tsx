import React, { useState, useEffect } from 'react';
import { PlazoForm } from '../components/plazos/PlazoForm';
import { Loading } from '../components/ui/Loading';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { plazosService, NuevoPlazoPayload, NuevoPlazoDetallePayload } from '../services/plazosService';
import { catalogosService } from '../services/catalogosService';
import { Plazo, PlazoDetalle, TipoDocumento } from '../types/database';
import { CalendarDays, Plus, Edit2, Trash2 } from 'lucide-react';

export const PlazosPage: React.FC = () => {
  const [plazos, setPlazos] = useState<Plazo[]>([]);
  const [tiposDoc, setTiposDoc] = useState<TipoDocumento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estado del formulario (Modal/Vista de edición)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlazo, setEditingPlazo] = useState<Plazo | undefined>(undefined);
  const [editingDetalles, setEditingDetalles] = useState<PlazoDetalle[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [plazosData, tiposDocData] = await Promise.all([
        plazosService.getPlazos(),
        catalogosService.getTiposDocumento()
      ]);
      setPlazos(plazosData);
      setTiposDoc(tiposDocData);
    } catch (error) {
      console.error('Error cargando datos de plazos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenNew = () => {
    setEditingPlazo(undefined);
    setEditingDetalles([]);
    setIsFormOpen(true);
  };

  const handleOpenEdit = async (plazo: Plazo) => {
    try {
      setIsLoading(true);
      const detalles = await plazosService.getPlazoDetalles(plazo.id);
      setEditingPlazo(plazo);
      setEditingDetalles(detalles);
      setIsFormOpen(true);
    } catch (e) {
      console.error(e);
      alert('Error cargando detalles del plazo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este plazo? Podría afectar ventas registradas si no hay integridad referencial.')) {
      try {
        setIsLoading(true);
        await plazosService.deletePlazo(id);
        await loadData();
      } catch (e) {
        console.error(e);
        alert('Error al eliminar plazo. Es posible que esté en uso.');
        setIsLoading(false);
      }
    }
  };

  const handleSave = async (payload: NuevoPlazoPayload, detalles: Omit<NuevoPlazoDetallePayload, 'plazo_id'>[]) => {
    try {
      setIsSaving(true);
      if (editingPlazo) {
        await plazosService.updatePlazo(editingPlazo.id, payload, detalles);
      } else {
        await plazosService.createPlazo(payload, detalles);
      }
      setIsFormOpen(false);
      await loadData();
    } catch (e) {
      console.error(e);
      alert('Error guardando el plazo. Verifique consola.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !isFormOpen && plazos.length === 0) {
    return <Loading message="Cargando ABM de Plazos..." fullPage />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Configuración de Plazos
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Parametrización administrativa de planes de cuotas (regular e irregular). Los vendedores eligen el plan al registrar ventas o compras.
          </p>
        </div>
        {!isFormOpen && (
          <Button variant="primary" onClick={handleOpenNew} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Plazo
          </Button>
        )}
      </div>

      {isFormOpen ? (
        <PlazoForm
          initialPlazo={editingPlazo}
          initialDetalles={editingDetalles}
          tiposDoc={tiposDoc}
          onSave={handleSave}
          onCancel={() => setIsFormOpen(false)}
          isLoading={isSaving}
        />
      ) : (
        <Card className="overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b-2 border-slate-300 text-slate-500 font-bold uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Descripción</th>
                  <th className="px-6 py-4">Tipo Doc.</th>
                  <th className="px-6 py-4">Cuotas</th>
                  <th className="px-6 py-4">Modalidad</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plazos.map((p) => {
                  const tipo = tiposDoc.find(t => t.id === p.tipo_id);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-400">#{p.id}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{p.plazo}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                          {tipo?.descripcion || 'Desconocido'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold">{p.cuotas}</td>
                      <td className="px-6 py-4">
                        {p.irregular ? (
                          <span className="text-orange-600 font-bold text-xs bg-orange-50 px-2 py-1 rounded">IRREGULAR</span>
                        ) : (
                          <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded">REGULAR</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {p.activo ? (
                          <span className="text-emerald-500 font-bold">Activo</span>
                        ) : (
                          <span className="text-slate-400 font-bold">Inactivo</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {plazos.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      <CalendarDays className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                      <p className="font-medium text-lg">No hay plazos configurados</p>
                      <p className="text-sm">Agregue plazos para usarlos en el módulo de ventas.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
