import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'ADVERTENCIA: Las variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no están configuradas en el archivo .env. ' +
    'La aplicación podría fallar al realizar consultas reales a la base de datos.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
