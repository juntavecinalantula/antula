import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MapLibreView } from './components/MapLibreView';
import { TableroView } from './components/TableroView';
import { ReclamosView } from './components/ReclamosView';
import { ObrasView } from './components/ObrasView';
import { CatastroView } from './components/CatastroView';
import { AsistenteView } from './components/AsistenteView';
import { ConfiguracionView } from './components/ConfiguracionView';
import { NuevoReclamoModal } from './components/NuevoReclamoModal';
import {
  CalleFeature,
  ManzanaFeature,
  Reclamo,
  ViewMode,
  Cuadrilla,
  OrdenTrabajo,
} from './types';
import {
  SEED_RECLAMOS,
  SEED_CUADRILLAS,
  SEED_OBRAS,
  insforgeClient,
} from './lib/insforge';

// Import spatial datasets
import callesData from './data/calles.json';
import manzanasData from './data/manzanas.json';

import {
  Search,
  Bell,
  Plus,
  ShieldCheck,
  User,
  Menu,
  X,
  Compass,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('tablero');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core municipal states with local persistence
  const [reclamos, setReclamos] = useState<Reclamo[]>(() => {
    try {
      const saved = localStorage.getItem('antula_reclamos');
      return saved ? JSON.parse(saved) : SEED_RECLAMOS;
    } catch {
      return SEED_RECLAMOS;
    }
  });

  const [cuadrillas, setCuadrillas] = useState<Cuadrilla[]>(() => {
    try {
      const saved = localStorage.getItem('antula_cuadrillas');
      return saved ? JSON.parse(saved) : SEED_CUADRILLAS;
    } catch {
      return SEED_CUADRILLAS;
    }
  });

  const [obras, setObras] = useState<OrdenTrabajo[]>(() => {
    try {
      const saved = localStorage.getItem('antula_obras');
      return saved ? JSON.parse(saved) : SEED_OBRAS;
    } catch {
      return SEED_OBRAS;
    }
  });

  // Selected features on map
  const [selectedManzana, setSelectedManzana] = useState<ManzanaFeature['properties'] | null>(null);
  const [selectedCalle, setSelectedCalle] = useState<CalleFeature['properties'] | null>(null);
  const [selectedReclamo, setSelectedReclamo] = useState<Reclamo | null>(null);

  // Modal New Claim State
  const [isNuevoReclamoOpen, setIsNuevoReclamoOpen] = useState(false);
  const [newReclamoCoords, setNewReclamoCoords] = useState<[number, number] | undefined>(undefined);
  const [newReclamoContext, setNewReclamoContext] = useState<{ manzana?: string; calleId?: number }>({});

  // Persist state to local storage
  useEffect(() => {
    localStorage.setItem('antula_reclamos', JSON.stringify(reclamos));
  }, [reclamos]);

  useEffect(() => {
    localStorage.setItem('antula_cuadrillas', JSON.stringify(cuadrillas));
  }, [cuadrillas]);

  useEffect(() => {
    localStorage.setItem('antula_obras', JSON.stringify(obras));
  }, [obras]);

  // Handlers
  const handleAddReclamo = (nuevo: Reclamo) => {
    setReclamos((prev) => [nuevo, ...prev]);
  };

  const handleUpdateReclamo = (updated: Reclamo) => {
    setReclamos((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleAddOrdenTrabajo = (nueva: OrdenTrabajo) => {
    setObras((prev) => [nueva, ...prev]);
  };

  const handleNewReclamoAtCoordinates = (
    coords: [number, number],
    info?: { manzana?: string; calleId?: number }
  ) => {
    setNewReclamoCoords(coords);
    setNewReclamoContext(info || {});
    setIsNuevoReclamoOpen(true);
  };

  const handleSelectReclamoOnMap = (r: Reclamo) => {
    setSelectedReclamo(r);
    setSelectedManzana(null);
    setSelectedCalle(null);
    setCurrentView('mapa');
  };

  const handleSelectManzanaOnMap = (m: ManzanaFeature['properties']) => {
    setSelectedManzana(m);
    setSelectedCalle(null);
    setSelectedReclamo(null);
    setCurrentView('mapa');
  };

  const handleSelectCalleOnMap = (c: CalleFeature['properties']) => {
    setSelectedCalle(c);
    setSelectedManzana(null);
    setSelectedReclamo(null);
    setCurrentView('mapa');
  };

  const handleResetSeeds = () => {
    setReclamos(SEED_RECLAMOS);
    setCuadrillas(SEED_CUADRILLAS);
    setObras(SEED_OBRAS);
    localStorage.removeItem('antula_reclamos');
    localStorage.removeItem('antula_cuadrillas');
    localStorage.removeItem('antula_obras');
  };

  const cuadrillasActivas = cuadrillas.filter((c) => c.estado === 'en_calle').length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800">
      {/* Sidebar for Desktop */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar
          currentView={currentView}
          onNavigate={(view) => {
            setCurrentView(view);
          }}
          reclamosCount={reclamos.filter((r) => r.estado !== 'finalizado').length}
          cuadrillasActivas={cuadrillasActivas}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-64 flex">
            <Sidebar
              currentView={currentView}
              onNavigate={(view) => {
                setCurrentView(view);
                setMobileMenuOpen(false);
              }}
              reclamosCount={reclamos.filter((r) => r.estado !== 'finalizado').length}
              cuadrillasActivas={cuadrillasActivas}
            />
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4 flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black text-slate-900 font-display capitalize">
                  {currentView === 'tablero'
                    ? 'Tablero Ejecutivo'
                    : currentView === 'mapa'
                    ? 'Visor Cartográfico SIG'
                    : currentView === 'reclamos'
                    ? 'Reclamos y Solicitudes'
                    : currentView === 'obras'
                    ? 'Obras y Cuadrillas'
                    : currentView === 'catastro'
                    ? 'Catastro Territorial'
                    : currentView === 'asistente'
                    ? 'Asistente IA Municipal'
                    : 'Configuración de Sistema'}
                </h1>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                  Antula
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Municipio Digital • Sistema de Atención y Catastro
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* InsForge Status Indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>InsForge BaaS Online</span>
            </div>

            {/* Quick Action + Nuevo Reclamo */}
            <button
              onClick={() => {
                setNewReclamoCoords(undefined);
                setNewReclamoContext({});
                setIsNuevoReclamoOpen(true);
              }}
              className="px-3 sm:px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo Reclamo</span>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                OP
              </div>
              <div className="hidden xl:block text-left">
                <span className="block text-xs font-bold text-slate-800 leading-tight">Operador SIG</span>
                <span className="block text-[10px] text-slate-400 leading-tight">Obras Públicas</span>
              </div>
            </div>
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 relative">
          {currentView === 'tablero' && (
            <TableroView
              reclamos={reclamos}
              onNavigate={(v) => setCurrentView(v)}
              onOpenNuevoReclamo={() => {
                setNewReclamoCoords(undefined);
                setNewReclamoContext({});
                setIsNuevoReclamoOpen(true);
              }}
              onSelectReclamo={handleSelectReclamoOnMap}
            />
          )}

          {currentView === 'mapa' && (
            <div className="h-full w-full">
              <MapLibreView
                manzanasGeojson={manzanasData}
                callesGeojson={callesData}
                reclamos={reclamos}
                selectedManzana={selectedManzana}
                onSelectManzana={setSelectedManzana}
                selectedCalle={selectedCalle}
                onSelectCalle={setSelectedCalle}
                selectedReclamo={selectedReclamo}
                onSelectReclamo={setSelectedReclamo}
                onNewReclamoAtCoordinates={handleNewReclamoAtCoordinates}
              />
            </div>
          )}

          {currentView === 'reclamos' && (
            <ReclamosView
              reclamos={reclamos}
              cuadrillas={cuadrillas}
              onUpdateReclamo={handleUpdateReclamo}
              onOpenNuevoReclamo={() => {
                setNewReclamoCoords(undefined);
                setNewReclamoContext({});
                setIsNuevoReclamoOpen(true);
              }}
              onSelectReclamoOnMap={handleSelectReclamoOnMap}
            />
          )}

          {currentView === 'obras' && (
            <ObrasView
              cuadrillas={cuadrillas}
              obras={obras}
              reclamos={reclamos}
              onAddOrdenTrabajo={handleAddOrdenTrabajo}
            />
          )}

          {currentView === 'catastro' && (
            <CatastroView
              manzanasGeojson={manzanasData}
              callesGeojson={callesData}
              onSelectManzanaOnMap={handleSelectManzanaOnMap}
              onSelectCalleOnMap={handleSelectCalleOnMap}
              onNavigate={(v) => setCurrentView(v)}
            />
          )}

          {currentView === 'asistente' && (
            <AsistenteView
              reclamos={reclamos}
              onOpenNuevoReclamo={() => {
                setNewReclamoCoords(undefined);
                setNewReclamoContext({});
                setIsNuevoReclamoOpen(true);
              }}
            />
          )}

          {currentView === 'configuracion' && (
            <ConfiguracionView onResetSeeds={handleResetSeeds} reclamos={reclamos} />
          )}
        </main>
      </div>

      {/* New Claim Modal */}
      <NuevoReclamoModal
        isOpen={isNuevoReclamoOpen}
        onClose={() => setIsNuevoReclamoOpen(false)}
        onAddReclamo={handleAddReclamo}
        initialCoords={newReclamoCoords}
        initialManzana={newReclamoContext.manzana}
        initialCalleId={newReclamoContext.calleId}
      />
    </div>
  );
}
