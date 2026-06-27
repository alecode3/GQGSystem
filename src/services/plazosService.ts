import { supabase } from './supabaseClient';
import { Plazo, PlazoDetalle } from '../types/database';

export type NuevoPlazoPayload = Omit<Plazo, 'id'>;
export type NuevoPlazoDetallePayload = Omit<PlazoDetalle, 'id'>;

export const plazosService = {
  async getPlazos(): Promise<Plazo[]> {
    const { data, error } = await supabase
      .from('plazos')
      .select('*')
      .order('id');
    
    if (error) throw error;
    return data || [];
  },

  async getPlazoDetalles(plazoId: number): Promise<PlazoDetalle[]> {
    const { data, error } = await supabase
      .from('plazo_detalles')
      .select('*')
      .eq('plazo_id', plazoId)
      .order('cuota');
    
    if (error) throw error;
    return data || [];
  },

  async createPlazo(payload: NuevoPlazoPayload, detalles: Omit<NuevoPlazoDetallePayload, 'plazo_id'>[]): Promise<Plazo> {
    // Insertar plazo
    const { data: plazo, error: plazoError } = await supabase
      .from('plazos')
      .insert([payload])
      .select()
      .single();
    
    if (plazoError) throw plazoError;
    if (!plazo) throw new Error('No se pudo crear el plazo.');

    // Insertar detalles si hay (para crédito irregular)
    if (detalles.length > 0) {
      const detallesPayload: NuevoPlazoDetallePayload[] = detalles.map(d => ({
        ...d,
        plazo_id: plazo.id
      }));

      const { error: detallesError } = await supabase
        .from('plazo_detalles')
        .insert(detallesPayload);
      
      if (detallesError) {
        console.error('Error insertando detalles, borrando plazo...', detallesError);
        // Compensación simple manual si falla detalles
        await supabase.from('plazos').delete().eq('id', plazo.id);
        throw detallesError;
      }
    }

    return plazo;
  },

  async updatePlazo(id: number, payload: Partial<NuevoPlazoPayload>, detalles: Omit<NuevoPlazoDetallePayload, 'plazo_id'>[]): Promise<Plazo> {
    // Actualizar plazo
    const { data: plazo, error: plazoError } = await supabase
      .from('plazos')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    
    if (plazoError) throw plazoError;

    // Actualizar detalles (borramos viejos, insertamos nuevos)
    const { error: deleteError } = await supabase
      .from('plazo_detalles')
      .delete()
      .eq('plazo_id', id);
    
    if (deleteError) throw deleteError;

    if (detalles.length > 0) {
      const detallesPayload: NuevoPlazoDetallePayload[] = detalles.map(d => ({
        ...d,
        plazo_id: id
      }));

      const { error: insertError } = await supabase
        .from('plazo_detalles')
        .insert(detallesPayload);
      
      if (insertError) throw insertError;
    }

    return plazo;
  },

  async deletePlazo(id: number): Promise<void> {
    // Borramos explícitamente los detalles primero
    await supabase.from('plazo_detalles').delete().eq('plazo_id', id);

    const { error } = await supabase
      .from('plazos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
