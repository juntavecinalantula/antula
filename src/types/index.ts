export type ViewMode = 'tablero' | 'mapa' | 'reclamos' | 'obras' | 'catastro' | 'asistente' | 'configuracion';

export type ReclamoEstado = 'recibido' | 'en_proceso' | 'cuadrilla_asignada' | 'finalizado' | 'rechazado';
export type ReclamoPrioridad = 'baja' | 'media' | 'alta' | 'urgente';
export type ReclamoCategoria = 'vialidad' | 'alumbrado' | 'arbolado' | 'agua_cloacas' | 'residuos' | 'obras_privadas';

export interface Reclamo {
  id: string;
  codigo: string;
  titulo: string;
  descripcion: string;
  categoria: ReclamoCategoria;
  estado: ReclamoEstado;
  prioridad: ReclamoPrioridad;
  fechaCreacion: string;
  fechaActualizacion: string;
  manzanaCodigo?: string;
  calleId?: number;
  calleNombre?: string;
  ubicacionNombre: string;
  coordenadas: [number, number]; // [lon, lat]
  vecinoNombre: string;
  vecinoTelefono?: string;
  cuadrillaAsignada?: string;
  fotoUrl?: string;
  fotoResolucionUrl?: string;
  observaciones?: string;
}

export interface ManzanaFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  properties: {
    fid?: number;
    id: number;
    codigo: string;
    nombre: string;
    mza?: string;
    barrio_id?: number | null;
    tipo?: string;
    dominio_tipo?: string;
    observaciones?: string | null;
    created_at?: string;
    updated_at?: string;
    superficie_m2?: number | null;
    perimetro_m?: number | null;
  };
}

export interface CalleFeature {
  type: 'Feature';
  geometry: {
    type: 'MultiLineString' | 'LineString';
    coordinates: number[][][] | number[][];
  };
  properties: {
    fid?: number;
    id: number;
    tipo: number; // 1: asfalto, 2: ripio c/cuneta
    Asfalto?: string;
    nombre?: string | null;
    jerarquia?: string;
    sentido?: string;
    estado?: string;
    ancho_m?: number | null;
    observaciones?: string | null;
    created_at?: string;
    updated_at?: string;
    material?: string | null;
    dominio_material?: string;
    dominio_jerarquia?: string;
    dominio_sentido?: string;
    dominio_estado?: string;
    longitud_m?: number | null;
  };
}

export interface Cuadrilla {
  id: string;
  nombre: string;
  responsable: string;
  tipo: 'vial' | 'alumbrado' | 'espacios_verdes' | 'saneamiento';
  integrantes: number;
  vehiculo: string;
  estado: 'disponible' | 'en_calle' | 'taller';
  trabajoActual?: string;
}

export interface OrdenTrabajo {
  id: string;
  codigo: string;
  titulo: string;
  cuadrillaId: string;
  reclamoId?: string;
  calleId?: number;
  manzanaCodigo?: string;
  fechaInicio: string;
  fechaEstimadaFin: string;
  estado: 'programada' | 'en_ejecucion' | 'completada';
  prioridad: ReclamoPrioridad;
}
