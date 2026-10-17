import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  HardHat,
  TrendingUp,
  MapPin,
  Compass,
  ArrowUpRight,
  ShieldAlert,
  Flame,
  FileSpreadsheet,
  Construction
} from 'lucide-react';
import { Reclamo, ViewMode } from '../types';

interface TableroViewProps {
  reclamos: Reclamo[];
  onNavigate: (view: ViewMode) => void;
  onOpenNuevoReclamo: () => void;
  onSelectReclamo: (r: Reclamo) => void;
}

export const TableroView: React.FC<TableroViewProps> = ({
  reclamos,
  onNavigate,
  onOpenNuevoReclamo,
  onSelectReclamo,
}) => {
  const totalReclamos = reclamos.length;
  const reclamosResueltos = reclamos.filter(r => r.estado === 'finalizado').length;
  const reclamosPendientes = reclamos.filter(r => r.estado !== 'finalizado' && r.estado !== 'rechazado').length;
  const reclamosUrgentes = reclamos.filter(r => r.prioridad === 'urgente' && r.estado !== 'finalizado').length;

  const tasaResolucion = totalReclamos > 0 ? Math.round((reclamosResueltos / totalReclamos) * 100) : 0;

  // Spatial stats from Antula GPKG data:
  const totalManzanas = 132;
  const totalCalles = 70;
  const callesAsfalto = 29;
  const callesRipio = 41;
  const porcentajeAsfalto = Math.round((callesAsfalto / totalCalles) * 100);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-brand-700/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-md">
              Módulo Central de Operaciones
            </span>
            <span className="text-brand-200 text-xs">Antula, Santiago del Estero</span>
          </div>
          <h2 className="text-2xl font-black font-display tracking-tight">
            Gestión Territorial & Reclamos Vecinales
          </h2>
          <p className="text-sm text-brand-100 max-w-xl mt-1 leading-relaxed">
            Plataforma integral para seguimiento de infraestructura urbana, mantenimiento vial,
            servicios públicos y resolución de incidentes ciudadanos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('mapa')}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all backdrop-blur-md border border-white/20 flex items-center gap-2"
          >
            <Compass className="w-4 h-4" />
            Abrir Visor SIG
          </button>
          <button
            onClick={onOpenNuevoReclamo}
            className="px-4 py-2.5 bg-white text-brand-700 hover:bg-brand-50 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            + Nuevo Reclamo
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Reclamos Activos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reclamos Activos</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800 font-display">{reclamosPendientes}</span>
            <span className="text-xs font-bold text-slate-400">en proceso</span>
          </div>
          <div className="mt-2 flex items-center text-xs text-rose-600 font-semibold gap-1">
            <Flame className="w-3.5 h-3.5" />
            <span>{reclamosUrgentes} con prioridad urgente</span>
          </div>
        </div>

        {/* Card 2: Tasa de Resolución */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resolución SLA</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800 font-display">{tasaResolucion}%</span>
            <span className="text-xs font-bold text-emerald-600">tasa efectiva</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {reclamosResueltos} de {totalReclamos} completados con éxito
          </div>
        </div>

        {/* Card 3: Infraestructura Vial */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Red Vial Urbana</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Construction className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800 font-display">{totalCalles}</span>
            <span className="text-xs font-bold text-slate-400">tramos totales</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 font-semibold">
            <span className="text-brand-600">{callesAsfalto} asfalto</span> ({porcentajeAsfalto}%) •{' '}
            <span className="text-amber-600">{callesRipio} ripio c/cuneta</span>
          </div>
        </div>

        {/* Card 4: Catastro Territorial */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Manzanas Urbanas</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800 font-display">{totalManzanas}</span>
            <span className="text-xs font-bold text-slate-400">georreferenciadas</span>
          </div>
          <div className="mt-2 text-xs text-indigo-600 font-semibold flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>Códigos M-001 a M-138 en SIG</span>
          </div>
        </div>
      </div>

      {/* Middle Row: Infrastructure Paving Progress & Active Crews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Paving breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 font-display">Estado de Pavimentación</h3>
              <span className="text-xs font-semibold text-brand-600">calles.gpkg</span>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-brand-700 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-600 inline-block"></span>
                  Asfalto: {callesAsfalto} ({porcentajeAsfalto}%)
                </span>
                <span className="text-amber-700 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                  Ripio c/ Cuneta: {callesRipio} ({100 - porcentajeAsfalto}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3.5 bg-amber-100 rounded-full overflow-hidden flex shadow-inner">
                <div
                  className="bg-brand-600 h-full transition-all duration-500"
                  style={{ width: `${porcentajeAsfalto}%` }}
                  title={`Asfalto: ${porcentajeAsfalto}%`}
                />
                <div
                  className="bg-amber-500 h-full transition-all duration-500"
                  style={{ width: `${100 - porcentajeAsfalto}%` }}
                  title={`Ripio con cuneta: ${100 - porcentajeAsfalto}%`}
                />
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-500 space-y-1.5 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p>
                <strong>Observación SIG:</strong> Los tramos de ripio requieren mantenimiento periódico con
                motoniveladora tras temporadas de precipitaciones para prevenir anegamientos.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('mapa')}
            className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
          >
            Ver Trazado Vial en Mapa SIG
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Reclamos Recientes con Acción Directa */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800 font-display">Reclamos Recientes de Vecinos</h3>
              <p className="text-xs text-slate-400">Reportes geolocalizados en el barrio</p>
            </div>
            <button
              onClick={() => onNavigate('reclamos')}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Ver todos ({totalReclamos})
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {reclamos.slice(0, 4).map((rec) => (
              <div
                key={rec.id}
                onClick={() => onSelectReclamo(rec)}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xs ${
                      rec.prioridad === 'urgente'
                        ? 'bg-rose-500'
                        : rec.estado === 'finalizado'
                        ? 'bg-emerald-500'
                        : 'bg-brand-500'
                    }`}
                  >
                    {rec.categoria.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{rec.titulo}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rec.estado === 'finalizado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.prioridad === 'urgente'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {rec.estado.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{rec.codigo}</span>
                      <span>•</span>
                      <span>{rec.ubicacionNombre}</span>
                      <span>•</span>
                      <span>{rec.vecinoNombre}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-[10px] font-semibold text-slate-400 block">
                    {new Date(rec.fechaCreacion).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                  </span>
                  <span className="text-xs font-bold text-brand-600 hover:underline">Ver ficha</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
