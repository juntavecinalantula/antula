import React, { useState } from 'react';
import {
  Compass,
  Search,
  Download,
  Filter,
  Eye,
  Layers,
  MapPin,
  CheckCircle2,
  FileSpreadsheet,
  Construction
} from 'lucide-react';
import { CalleFeature, ManzanaFeature, ViewMode } from '../types';

interface CatastroViewProps {
  manzanasGeojson: any;
  callesGeojson: any;
  onSelectManzanaOnMap: (m: ManzanaFeature['properties']) => void;
  onSelectCalleOnMap: (c: CalleFeature['properties']) => void;
  onNavigate: (view: ViewMode) => void;
}

export const CatastroView: React.FC<CatastroViewProps> = ({
  manzanasGeojson,
  callesGeojson,
  onSelectManzanaOnMap,
  onSelectCalleOnMap,
  onNavigate,
}) => {
  const [tab, setTab] = useState<'manzanas' | 'calles'>('manzanas');
  const [search, setSearch] = useState('');
  const [filtroCalleTipo, setFiltroCalleTipo] = useState<'todos' | 1 | 2>('todos');

  const manzanasList: ManzanaFeature['properties'][] =
    manzanasGeojson?.features?.map((f: any) => f.properties) || [];

  const callesList: CalleFeature['properties'][] =
    callesGeojson?.features?.map((f: any) => f.properties) || [];

  const filteredManzanas = manzanasList.filter((m) =>
    m.codigo?.toLowerCase().includes(search.toLowerCase()) ||
    m.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    m.mza?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCalles = callesList.filter((c) => {
    const matchesTipo = filtroCalleTipo === 'todos' || c.tipo === filtroCalleTipo;
    const matchesSearch =
      c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      `calle ${c.id}`.includes(search.toLowerCase()) ||
      c.jerarquia?.toLowerCase().includes(search.toLowerCase());
    return matchesTipo && matchesSearch;
  });

  const exportGeoJSON = (type: 'manzanas' | 'calles') => {
    const data = type === 'manzanas' ? manzanasGeojson : callesGeojson;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_antula.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-800 font-display">Catastro y Territorio Municipal</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Datos GPKG Oficiales
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Inventario espacial de 132 manzanas catastrales y 70 tramos viales georreferenciados
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab buttons */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => {
                setTab('manzanas');
                setSearch('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tab === 'manzanas' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Manzanas ({manzanasList.length})
            </button>
            <button
              onClick={() => {
                setTab('calles');
                setSearch('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tab === 'calles' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Calles ({callesList.length})
            </button>
          </div>

          <button
            onClick={() => exportGeoJSON(tab)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            title="Descargar capa en formato GeoJSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar GeoJSON</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/80 text-xs">
        <div className="flex items-center bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-200/80 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input
            type="text"
            placeholder={
              tab === 'manzanas'
                ? 'Filtrar por código de manzana (ej: M-039, Baldio)...'
                : 'Filtrar por ID de tramo o nombre de calle...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent outline-none text-slate-700 placeholder-slate-400"
          />
        </div>

        {tab === 'calles' && (
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold text-[11px]">Material:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setFiltroCalleTipo('todos')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                  filtroCalleTipo === 'todos' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Todas (70)
              </button>
              <button
                onClick={() => setFiltroCalleTipo(1)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                  filtroCalleTipo === 1 ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'
                }`}
              >
                Asfalto (29)
              </button>
              <button
                onClick={() => setFiltroCalleTipo(2)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                  filtroCalleTipo === 2 ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700'
                }`}
              >
                Ripio c/ Cuneta (41)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tables */}
      {tab === 'manzanas' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto max-h-[68vh]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4">Código Manzana</th>
                  <th className="py-3 px-4">Nombre Registrado</th>
                  <th className="py-3 px-4">MZA Original</th>
                  <th className="py-3 px-4">Tipo Catastral</th>
                  <th className="py-3 px-4">ID Técnico</th>
                  <th className="py-3 px-4">Fecha Digitalización</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredManzanas.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold font-mono text-brand-700">{m.codigo}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{m.nombre || 'Sin nombre'}</td>
                    <td className="py-3 px-4 text-slate-600">{m.mza || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                        {m.tipo || 'manzana'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">#{m.id}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {m.created_at ? new Date(m.created_at).toLocaleDateString('es-AR') : '2026-10-13'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          onSelectManzanaOnMap(m);
                          onNavigate('mapa');
                        }}
                        className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg font-bold text-[11px] transition-colors inline-flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3" />
                        Ver en Mapa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto max-h-[68vh]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4">ID Tramo</th>
                  <th className="py-3 px-4">Material / Pavimento</th>
                  <th className="py-3 px-4">Nombre Calle</th>
                  <th className="py-3 px-4">Jerarquía</th>
                  <th className="py-3 px-4">Sentido</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredCalles.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold font-mono text-slate-800">#{c.id}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.tipo === 1 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {c.tipo === 1 ? 'Asfalto' : 'Ripio con Cuneta'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{c.nombre || `Calle Tramo ${c.id}`}</td>
                    <td className="py-3 px-4 text-slate-600 capitalize">{c.jerarquia || 'Calle Local'}</td>
                    <td className="py-3 px-4 text-slate-600 capitalize">{c.sentido || 'Doble mano'}</td>
                    <td className="py-3 px-4 text-slate-600 capitalize">{c.estado || 'Regular'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          onSelectCalleOnMap(c);
                          onNavigate('mapa');
                        }}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-bold text-[11px] transition-colors inline-flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3" />
                        Ver en Mapa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
