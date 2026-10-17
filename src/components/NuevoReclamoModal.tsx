import React, { useState } from 'react';
import { AlertCircle, Camera, MapPin, X, Plus, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Reclamo, ReclamoCategoria, ReclamoPrioridad } from '../types';

interface NuevoReclamoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddReclamo: (nuevo: Reclamo) => void;
  initialCoords?: [number, number];
  initialManzana?: string;
  initialCalleId?: number;
}

const SAMPLE_PHOTOS = [
  { name: 'Bache en calzada', url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80' },
  { name: 'Luminaria apagada', url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80' },
  { name: 'Pasto crecido / Maleza', url: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=600&auto=format&fit=crop&q=80' },
  { name: 'Cuneta colmatada', url: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80' }
];

export const NuevoReclamoModal: React.FC<NuevoReclamoModalProps> = ({
  isOpen,
  onClose,
  onAddReclamo,
  initialCoords,
  initialManzana,
  initialCalleId,
}) => {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState<ReclamoCategoria>('vialidad');
  const [prioridad, setPrioridad] = useState<ReclamoPrioridad>('alta');
  const [manzanaCodigo, setManzanaCodigo] = useState(initialManzana || 'M-039');
  const [calleId, setCalleId] = useState<number | undefined>(initialCalleId || 1);
  const [ubicacionNombre, setUbicacionNombre] = useState(
    initialManzana ? `Manzana ${initialManzana}` : 'Barrio Antula'
  );
  const [vecinoNombre, setVecinoNombre] = useState('');
  const [vecinoTelefono, setVecinoTelefono] = useState('');
  const [fotoUrl, setFotoUrl] = useState(SAMPLE_PHOTOS[0].url);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !vecinoNombre.trim()) return;

    const coords: [number, number] = initialCoords || [-64.244057, -27.703225];
    const nuevo: Reclamo = {
      id: `rec-${Date.now()}`,
      codigo: `REC-2026-${Math.floor(100 + Math.random() * 900)}`,
      titulo,
      descripcion,
      categoria,
      estado: 'recibido',
      prioridad,
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
      manzanaCodigo: manzanaCodigo || undefined,
      calleId: calleId || undefined,
      ubicacionNombre,
      coordenadas: coords,
      vecinoNombre,
      vecinoTelefono,
      fotoUrl,
    };

    onAddReclamo(nuevo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 font-display">Registrar Nuevo Reclamo Ciudadano</h3>
              <p className="text-[11px] text-slate-400">Atención municipal para vecinos de Antula</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Título o Asunto del Reclamo *</label>
            <input
              type="text"
              placeholder="ej: Bache profundo sobre ripio en esquina noroeste..."
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Categoría</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as ReclamoCategoria)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 outline-none font-medium"
              >
                <option value="vialidad">Vialidad & Baches</option>
                <option value="alumbrado">Alumbrado Público</option>
                <option value="agua_cloacas">Agua & Saneamiento</option>
                <option value="arbolado">Arbolado & Desmalezado</option>
                <option value="residuos">Recolección de Residuos</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Prioridad</label>
              <select
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value as ReclamoPrioridad)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 outline-none font-medium"
              >
                <option value="urgente">Urgente (Riesgo inminente)</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Manzana Catastral (Antula)</label>
              <input
                type="text"
                placeholder="ej: M-039"
                value={manzanaCodigo}
                onChange={(e) => setManzanaCodigo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 outline-none font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Ubicación / Referencia</label>
              <input
                type="text"
                placeholder="ej: Calle 1 casi esquina M-039"
                value={ubicacionNombre}
                onChange={(e) => setUbicacionNombre(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nombre del Vecino *</label>
              <input
                type="text"
                placeholder="ej: Silvia Herrera"
                value={vecinoNombre}
                onChange={(e) => setVecinoNombre(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Teléfono de Contacto</label>
              <input
                type="tel"
                placeholder="ej: +54 385 412-3891"
                value={vecinoTelefono}
                onChange={(e) => setVecinoTelefono(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Descripción del Incidente</label>
            <textarea
              rows={3}
              placeholder="Detalle el estado del problema, si impide el tránsito, etc..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Photo Selector */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Foto de Evidencia (Muestra rápida)</label>
            <div className="grid grid-cols-4 gap-2">
              {SAMPLE_PHOTOS.map((p, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setFotoUrl(p.url)}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                    fotoUrl === p.url ? 'border-brand-600 ring-2 ring-brand-200' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={p.url} alt={p.name} className="w-full h-14 object-cover" />
                  <span className="text-[9px] bg-slate-900/80 text-white block text-center truncate py-0.5 px-1">
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Ingresar Reclamo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
