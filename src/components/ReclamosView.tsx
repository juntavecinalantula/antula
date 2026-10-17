import React, { useState } from 'react';
import {
  AlertCircle,
  Search,
  Filter,
  Plus,
  Kanban,
  List,
  CheckCircle2,
  Clock,
  HardHat,
  XCircle,
  ChevronRight,
  Phone,
  MapPin,
  Calendar,
  Image as ImageIcon,
  Download
} from 'lucide-react';
import { Reclamo, ReclamoEstado, ReclamoPrioridad, Cuadrilla } from '../types';

interface ReclamosViewProps {
  reclamos: Reclamo[];
  cuadrillas: Cuadrilla[];
  onUpdateReclamo: (updated: Reclamo) => void;
  onOpenNuevoReclamo: () => void;
  onSelectReclamoOnMap: (r: Reclamo) => void;
}

export const ReclamosView: React.FC<ReclamosViewProps> = ({
  reclamos,
  cuadrillas,
  onUpdateReclamo,
  onOpenNuevoReclamo,
  onSelectReclamoOnMap,
}) => {
  const [viewMode, setViewMode] = useState<'lista' | 'kanban'>('lista');
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('todos');
  const [activeReclamoDetail, setActiveReclamoDetail] = useState<Reclamo | null>(null);

  // Filtered claims
  const filtered = reclamos.filter((r) => {
    const matchesSearch =
      r.titulo.toLowerCase().includes(search.toLowerCase()) ||
      r.codigo.toLowerCase().includes(search.toLowerCase()) ||
      r.ubicacionNombre.toLowerCase().includes(search.toLowerCase()) ||
      r.vecinoNombre.toLowerCase().includes(search.toLowerCase());

    const matchesEstado = filtroEstado === 'todos' || r.estado === filtroEstado;
    const matchesPrioridad = filtroPrioridad === 'todos' || r.prioridad === filtroPrioridad;

    return matchesSearch && matchesEstado && matchesPrioridad;
  });

  const estados: { id: ReclamoEstado; label: string; color: string; badge: string }[] = [
    { id: 'recibido', label: 'Recibido', color: 'border-blue-400 bg-blue-50/50', badge: 'bg-blue-100 text-blue-800' },
    { id: 'en_proceso', label: 'En Proceso', color: 'border-amber-400 bg-amber-50/50', badge: 'bg-amber-100 text-amber-800' },
    { id: 'cuadrilla_asignada', label: 'Cuadrilla Asignada', color: 'border-purple-400 bg-purple-50/50', badge: 'bg-purple-100 text-purple-800' },
    { id: 'finalizado', label: 'Finalizado', color: 'border-emerald-400 bg-emerald-50/50', badge: 'bg-emerald-100 text-emerald-800' },
  ];

  const handleStatusChange = (reclamo: Reclamo, newStatus: ReclamoEstado) => {
    const updated: Reclamo = {
      ...reclamo,
      estado: newStatus,
      fechaActualizacion: new Date().toISOString(),
    };
    onUpdateReclamo(updated);
    if (activeReclamoDetail?.id === reclamo.id) {
      setActiveReclamoDetail(updated);
    }
  };

  const handleAssignCuadrilla = (reclamo: Reclamo, cuadrillaNombre: string) => {
    const updated: Reclamo = {
      ...reclamo,
      cuadrillaAsignada: cuadrillaNombre,
      estado: 'cuadrilla_asignada',
      fechaActualizacion: new Date().toISOString(),
    };
    onUpdateReclamo(updated);
    if (activeReclamoDetail?.id === reclamo.id) {
      setActiveReclamoDetail(updated);
    }
  };

  const exportCSV = () => {
    const headers = ['Codigo', 'Titulo', 'Estado', 'Prioridad', 'Categoria', 'Ubicacion', 'Vecino', 'Fecha'];
    const rows = filtered.map(r => [
      r.codigo,
      `"${r.titulo.replace(/"/g, '""')}"`,
      r.estado,
      r.prioridad,
      r.categoria,
      `"${r.ubicacionNombre.replace(/"/g, '""')}"`,
      `"${r.vecinoNombre.replace(/"/g, '""')}"`,
      r.fechaCreacion
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reclamos_antula_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-800 font-display">Bandeja de Reclamos Vecinales</h2>
          <p className="text-xs text-slate-400">Atención ciudadana, clasificación y seguimiento operativo</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Toggle View Mode */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('lista')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'lista' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista Lista"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'kanban' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista Tablero Kanban"
            >
              <Kanban className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={exportCSV}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            title="Exportar Reclamos a CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            onClick={onOpenNuevoReclamo}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Nuevo Reclamo
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/80 text-xs">
        {/* Search */}
        <div className="flex items-center bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-200/80 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Buscar por código, título, manzana o vecino..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent outline-none text-slate-700 placeholder-slate-400"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-semibold text-[11px]">Estado:</span>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="bg-slate-50 border border-slate-200/80 rounded-lg px-2 py-1.5 text-slate-700 outline-none font-medium"
          >
            <option value="todos">Todos los estados</option>
            <option value="recibido">Recibidos</option>
            <option value="en_proceso">En Proceso</option>
            <option value="cuadrilla_asignada">Cuadrilla Asignada</option>
            <option value="finalizado">Finalizados</option>
          </select>
        </div>

        {/* Priority filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-semibold text-[11px]">Prioridad:</span>
          <select
            value={filtroPrioridad}
            onChange={(e) => setFiltroPrioridad(e.target.value)}
            className="bg-slate-50 border border-slate-200/80 rounded-lg px-2 py-1.5 text-slate-700 outline-none font-medium"
          >
            <option value="todos">Todas</option>
            <option value="urgente">Urgente</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>
      </div>

      {/* Main Content: List or Kanban */}
      {viewMode === 'lista' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Asunto & Descripción</th>
                  <th className="py-3 px-4">Ubicación / Mza</th>
                  <th className="py-3 px-4">Prioridad</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Cuadrilla</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold font-mono text-slate-800">{r.codigo}</td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-slate-800">{r.titulo}</div>
                      <div className="text-[11px] text-slate-400 truncate">{r.descripcion}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold">{r.ubicacionNombre}</div>
                      {r.manzanaCodigo && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                          {r.manzanaCodigo}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          r.prioridad === 'urgente'
                            ? 'bg-rose-100 text-rose-800'
                            : r.prioridad === 'alta'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {r.prioridad.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={r.estado}
                        onChange={(e) => handleStatusChange(r, e.target.value as ReclamoEstado)}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer ${
                          r.estado === 'finalizado'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : r.estado === 'cuadrilla_asignada'
                            ? 'bg-purple-50 border-purple-200 text-purple-800'
                            : r.estado === 'en_proceso'
                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                            : 'bg-blue-50 border-blue-200 text-blue-800'
                        }`}
                      >
                        <option value="recibido">Recibido</option>
                        <option value="en_proceso">En Proceso</option>
                        <option value="cuadrilla_asignada">Cuadrilla Asignada</option>
                        <option value="finalizado">Finalizado</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {r.cuadrillaAsignada || (
                        <span className="text-slate-400 italic">Sin asignar</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => onSelectReclamoOnMap(r)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-[11px]"
                      >
                        Mapa
                      </button>
                      <button
                        onClick={() => setActiveReclamoDetail(r)}
                        className="px-2 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-md font-semibold text-[11px]"
                      >
                        Ver Ficha
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {estados.map((col) => {
            const colItems = filtered.filter((r) => r.estado === col.id);

            return (
              <div key={col.id} className="bg-slate-100/70 p-3 rounded-2xl flex flex-col h-[70vh]">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider">{col.label}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                    {colItems.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {colItems.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => setActiveReclamoDetail(r)}
                      className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold font-mono text-slate-400">{r.codigo}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            r.prioridad === 'urgente'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {r.prioridad}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-800 leading-snug">{r.titulo}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{r.descripcion}</p>

                      <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-1 border-t border-slate-100">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{r.ubicacionNombre}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reclamo Detail Modal */}
      {activeReclamoDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-brand-100 text-brand-800 px-2 py-0.5 rounded-md">
                  {activeReclamoDetail.codigo}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    activeReclamoDetail.prioridad === 'urgente' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Prioridad {activeReclamoDetail.prioridad}
                </span>
              </div>

              <button
                onClick={() => setActiveReclamoDetail(null)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div>
                <h3 className="text-base font-black text-slate-800 font-display">{activeReclamoDetail.titulo}</h3>
                <p className="text-slate-600 mt-1 leading-relaxed">{activeReclamoDetail.descripcion}</p>
              </div>

              {activeReclamoDetail.fotoUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-200">
                  <img
                    src={activeReclamoDetail.fotoUrl}
                    alt="Evidencia fotográfica"
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-2 bg-slate-50 text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                    Fotografía de evidencia adjuntada por el vecino
                  </div>
                </div>
              )}

              {/* Geo & Resident Data */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">Vecino Solicitante</span>
                  <span className="font-bold text-slate-800">{activeReclamoDetail.vecinoNombre}</span>
                  {activeReclamoDetail.vecinoTelefono && (
                    <span className="text-slate-500 block text-[11px]">{activeReclamoDetail.vecinoTelefono}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Ubicación Territorial</span>
                  <span className="font-bold text-slate-800">{activeReclamoDetail.ubicacionNombre}</span>
                  {activeReclamoDetail.manzanaCodigo && (
                    <span className="text-brand-600 font-semibold block text-[11px]">
                      Manzana: {activeReclamoDetail.manzanaCodigo}
                    </span>
                  )}
                </div>
              </div>

              {/* Assignment Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Asignar a Cuadrilla Municipal</label>
                <select
                  value={activeReclamoDetail.cuadrillaAsignada || ''}
                  onChange={(e) => handleAssignCuadrilla(activeReclamoDetail, e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Seleccione una cuadrilla...</option>
                  {cuadrillas.map((c) => (
                    <option key={c.id} value={c.nombre}>
                      {c.nombre} ({c.estado === 'en_calle' ? 'En calle' : 'Disponible'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Update Buttons */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    onSelectReclamoOnMap(activeReclamoDetail);
                    setActiveReclamoDetail(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-brand-600" />
                  Ver en Mapa SIG
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange(activeReclamoDetail, 'finalizado')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Marcar Resuelto
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
