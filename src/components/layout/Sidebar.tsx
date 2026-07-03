import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, PlusCircle, Coins, Award, CalendarDays, ShoppingBag, CreditCard } from 'lucide-react';

const menuItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/ventas', label: 'Ver Ventas', icon: Receipt, exact: true },
  { to: '/ventas/nueva', label: 'Registrar Venta', icon: PlusCircle, exact: false },
  { to: '/cuentas-cobrar', label: 'Cuentas a Cobrar', icon: Coins, exact: false },
  { to: '/compras', label: 'Ver Compras', icon: ShoppingBag, exact: true },
  { to: '/compras/nueva', label: 'Registrar Compra', icon: PlusCircle, exact: false },
  { to: '/cuentas-pagar', label: 'Cuentas a Pagar', icon: CreditCard, exact: false },
  { to: '/plazos', label: 'Config. de Plazos', icon: CalendarDays, exact: false }
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-30 shadow-2xl border-r-2 border-slate-700">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg">
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

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-900/40 ring-1 ring-brand-400/50'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                  )}
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span className={isActive ? 'text-white' : ''}>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

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
