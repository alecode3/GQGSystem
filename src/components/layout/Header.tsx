import React from 'react';
import { Database, UserCheck, Wifi, WifiOff } from 'lucide-react';

export const Header: React.FC = () => {
  const isSupabaseConfigured = 
    import.meta.env.VITE_SUPABASE_URL && 
    !import.meta.env.VITE_SUPABASE_URL.includes('your-project-id') &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    import.meta.env.VITE_SUPABASE_ANON_KEY.length > 50;

  return (
    <header className="h-16 bg-white border-b-2 border-slate-300 px-8 flex items-center justify-between fixed top-0 right-0 left-64 z-20 shadow-lg shadow-slate-300/40">
      {/* Title / Breadcrumb context */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg">
          CONSOLA
        </span>
        <span className="text-sm font-semibold text-slate-500">
          Control de Facturas y Cuentas por Cobrar
        </span>
      </div>

      {/* Stats & User Info */}
      <div className="flex items-center gap-6">
        {/* Dynamic Database Badge */}
        {isSupabaseConfigured ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border-2 border-emerald-300 text-emerald-700 text-xs font-bold shadow-md shadow-emerald-200/60">
            <Wifi className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Supabase Conectado</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border-2 border-blue-300 text-blue-700 text-xs font-bold shadow-md shadow-blue-200/60">
            <WifiOff className="w-3.5 h-3.5 text-blue-600" />
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>Modo Simulado (Local)</span>
          </div>
        )}

        {/* Mock Session User */}
        <div className="flex items-center gap-2.5 border-l border-slate-200 pl-6">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
            <UserCheck className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-left">
            <span className="block text-xs font-bold text-slate-800 leading-tight">
              Prof. Evaluador
            </span>
            <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              IS3 - GQG System
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
