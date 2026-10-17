import React, { useState } from 'react';
import {
  HardHat,
  Truck,
  Users,
  CheckCircle2,
  Clock,
  Calendar,
  Plus,
  Compass,
  AlertTriangle,
  Play
} from 'lucide-react';
import { Cuadrilla, OrdenTrabajo, Reclamo } from '../types';

interface ObrasViewProps {
  cuadrillas: Cuadrilla[];
  obras: OrdenTrabajo[];
  reclamos: Reclamo[];
  onAddOrdenTrabajo: (nueva: OrdenTrabajo) => void;
}

export const ObrasView: React.FC<ObrasViewProps> = ({
  cuadrillas,
  obras,
  reclamos,
  onAddOrdenTrabajo,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [cuadrillaSeleccionada, setCuadrillaSeleccionada] = useState(cuadrillas[0]?.id || '');
  const [reclamoAsociado, setReclamoAsociado] = useState('');
  const [prioridad, setPrioridad] = useState<'baja' | 'media' | 'alta' | 'urgente'>('alta');

  const handleCreateOT = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTitulo.trim()) return;

    const nueva: OrdenTrabajo = {
      id: `ot-${Date.now()}`,
      codigo: `OT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      titulo: nuevoTitulo,
      cuadrillaId: cuadrillaSeleccionada,
      reclamoId: reclamoAsociado || undefined,
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaEstimadaFin: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      estado: 'en_ejecucion',
      prioridad,
    };

    onAddOrdenTrabajo(nueva);
    setShowModal(false);
    setNuevoTitulo('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-800 font-display">Obras Públicas y Cuadrillas Operativas</h2>
          <p className="text-xs text-slate-400">
            Despacho de motoniveladoras, hidroelevadores, mantenimiento de calles y servicios esenciales
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Nueva Orden de Trabajo (OT)
        </button>
      </div>

      {/* Cuadrillas Cards */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Cuadrillas y Equipamiento en Servicio
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cuadrillas.map((c) => (
            <div
              key={c.id}
              className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                      <HardHat className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-800">{c.nombre}</span>
                      <span className="block text-[10px] text-slate-400 font-medium">Resp: {c.responsable}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 mt-2">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{c.integrantes} operarios en dotación</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{c.vehiculo}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    c.estado === 'en_calle'
                      ? 'bg-amber-100 text-amber-800 animate-pulse'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {c.estado === 'en_calle' ? 'En Operación' : 'Disponible en Base'}
                </span>

                <span className="text-[10px] text-slate-400 truncate max-w-[120px] font-semibold">
                  {c.trabajoActual || 'Guardia'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Órdenes de Trabajo Activas */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs p-5">
        <h3 className="text-sm font-bold text-slate-800 font-display mb-3">Órdenes de Trabajo (OT) en Ejecución</h3>

        <div className="divide-y divide-slate-100 text-xs">
          {obras.map((ot) => {
            const crew = cuadrillas.find((c) => c.id === ot.cuadrillaId);

            return (
              <div key={ot.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    <Play className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800">{ot.codigo}</span>
                      <span className="text-xs font-bold text-slate-800">{ot.titulo}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ot.prioridad === 'alta' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {ot.prioridad.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                      <span><strong>Cuadrilla:</strong> {crew?.nombre || 'General'}</span>
                      <span>•</span>
                      <span><strong>Inicio:</strong> {ot.fechaInicio}</span>
                      <span>•</span>
                      <span><strong>Compromiso:</strong> {ot.fechaEstimadaFin}</span>
                      {ot.manzanaCodigo && (
                        <>
                          <span>•</span>
                          <span className="text-brand-600 font-semibold font-mono">Mza {ot.manzanaCodigo}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                    En Ejecución
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Nueva OT */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800 font-display">Crear Nueva Orden de Trabajo</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                ×
              </button>
            </div>

            <form onSubmit={handleCreateOT} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Título de la Obra / Tarea</label>
                <input
                  type="text"
                  placeholder="ej: Nivelado y relleno con ripio en acceso norte..."
                  value={nuevoTitulo}
                  onChange={(e) => setNuevoTitulo(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Cuadrilla Asignada</label>
                <select
                  value={cuadrillaSeleccionada}
                  onChange={(e) => setCuadrillaSeleccionada(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 outline-none font-medium"
                >
                  {cuadrillas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Vincular a Reclamo Vecinal (Opcional)</label>
                <select
                  value={reclamoAsociado}
                  onChange={(e) => setReclamoAsociado(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 outline-none font-medium"
                >
                  <option value="">Sin reclamo asociado</option>
                  {reclamos.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.codigo} - {r.titulo} ({r.ubicacionNombre})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Prioridad Operativa</label>
                <select
                  value={prioridad}
                  onChange={(e) => setPrioridad(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 outline-none font-medium"
                >
                  <option value="urgente">Urgente</option>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Emitir Orden de Trabajo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
