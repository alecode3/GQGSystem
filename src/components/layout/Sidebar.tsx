import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, PlusCircle, Coins, Award } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const menuItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/ventas', label: 'Ver Ventas', icon: Receipt },
    { to: '/ventas/nueva', label: 'Registrar Venta', icon: PlusCircle },
    { to: '/cuentas-cobrar', label: 'Cuentas a Cobrar', icon: Coins }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-30 shadow-xl border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/25">
          <Award className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg leading-tight tracking-tight">
            GQG <span className="text-brand-400">System</span>
          </h1>
          <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
            Facturación v2.0
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                    : 'text-slate-400 hover:bg-slate-850 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Academic Footer Info */}
      <div className="p-5 border-t border-slate-800 bg-slate-950/40 text-center">
        <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold">
          Ingeniería de Software III
        </span>
        <span className="block text-xs text-slate-400 mt-1 font-medium">
          Actividad Académica
        </span>
      </div>
    </aside>
  );
};
