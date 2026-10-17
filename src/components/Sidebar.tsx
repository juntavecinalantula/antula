import React from 'react';
import {
  LayoutDashboard,
  Map as MapIcon,
  AlertCircle,
  HardHat,
  Compass,
  Bot,
  Settings,
  Building2,
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { ViewMode } from '../types';

interface SidebarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  reclamosCount: number;
  cuadrillasActivas: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  reclamosCount,
  cuadrillasActivas,
}) => {
  const navItems = [
    {
      id: 'tablero' as ViewMode,
      label: 'Tablero de Gestión',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'mapa' as ViewMode,
      label: 'Visor SIG Territorial',
      icon: MapIcon,
      badge: 'SIG',
    },
    {
      id: 'reclamos' as ViewMode,
      label: 'Reclamos Vecinales',
      icon: AlertCircle,
      badge: reclamosCount > 0 ? `${reclamosCount}` : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'obras' as ViewMode,
      label: 'Obras y Cuadrillas',
      icon: HardHat,
      badge: `${cuadrillasActivas} activas`,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'catastro' as ViewMode,
      label: 'Catastro y Calles',
      icon: Compass,
      badge: '132 mza',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'asistente' as ViewMode,
      label: 'Asistente IA Municipal',
      icon: Bot,
      badge: 'IA',
      badgeColor: 'bg-indigo-100 text-indigo-700',
    },
    {
      id: 'configuracion' as ViewMode,
      label: 'InsForge & Sistema',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800 select-none shadow-xl">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 font-black text-xl tracking-wider">
          A
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-black text-white tracking-wide font-display">ANTULA</h1>
            <span className="text-[10px] bg-brand-500/20 text-brand-300 font-bold px-1.5 py-0.5 rounded border border-brand-500/30">
              GESTIÓN
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Sistema Municipal SIG</p>
        </div>
      </div>

      {/* Municipality Selector Pill */}
      <div className="mx-3 mt-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 overflow-hidden">
          <Building2 className="w-4 h-4 text-brand-400 flex-shrink-0" />
          <div className="truncate">
            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Jurisdicción</span>
            <span className="font-bold text-white text-xs truncate">Barrio Antula</span>
          </div>
        </div>
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Servicio en línea" />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 px-3 py-1">
          Módulos Operativos
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    item.badgeColor || 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* InsForge Status Badge in Sidebar Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="block text-[11px] font-bold text-slate-200">InsForge BaaS</span>
              <span className="block text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                PostgreSQL Activo
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('configuracion')}
            className="text-slate-400 hover:text-white p-1 rounded-md"
            title="Configurar InsForge"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
