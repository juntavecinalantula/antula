import { createClient } from '@insforge/sdk';
import { Reclamo, Cuadrilla, OrdenTrabajo } from '../types';

// Default configuration from environment variables or defaults
const DEFAULT_BASE_URL = import.meta.env.VITE_INSFORGE_BASE_URL || 'https://antula.region.insforge.app';
const DEFAULT_ANON_KEY = import.meta.env.VITE_INSFORGE_ANON_KEY || 'insforge-anon-antula-demo-key';

export interface InsForgeConfig {
  baseUrl: string;
  anonKey: string;
}

export function getStoredConfig(): InsForgeConfig {
  try {
    const saved = localStorage.getItem('antula_insforge_config');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading config:', e);
  }
  return {
    baseUrl: DEFAULT_BASE_URL,
    anonKey: DEFAULT_ANON_KEY,
  };
}

export function saveStoredConfig(config: InsForgeConfig) {
  localStorage.setItem('antula_insforge_config', JSON.stringify(config));
}

// Create SDK instance
export function initInsForgeClient(config: InsForgeConfig = getStoredConfig()) {
  try {
    return createClient({
      baseUrl: config.baseUrl,
      anonKey: config.anonKey,
    });
  } catch (err) {
    console.warn('InsForge client initialization warning:', err);
    return null;
  }
}

export let insforgeClient = initInsForgeClient();

export function refreshInsForgeClient(config: InsForgeConfig) {
  saveStoredConfig(config);
  insforgeClient = initInsForgeClient(config);
}

// Initial realistic seed dataset for Antula Barrio Municipal Reclamos
export const SEED_RECLAMOS: Reclamo[] = [
  {
    id: 'rec-001',
    codigo: 'REC-2026-081',
    titulo: 'Bache profundo sobre calle de ripio tras lluvia',
    descripcion: 'Se formó una cárcava importante sobre el cruce de calle que dificulta el paso de ambulancias y vehículos.',
    categoria: 'vialidad',
    estado: 'en_proceso',
    prioridad: 'alta',
    fechaCreacion: '2026-10-15T09:30:00Z',
    fechaActualizacion: '2026-10-16T14:20:00Z',
    manzanaCodigo: 'M-039',
    calleId: 1,
    calleNombre: 'Calle 1 (Asfalto)',
    ubicacionNombre: 'Manzana 39 - Intersección con Calle 1',
    coordenadas: [-64.2445, -27.7028],
    vecinoNombre: 'Carlos Alberto Gómez',
    vecinoTelefono: '+54 385 412-3891',
    cuadrillaAsignada: 'Cuadrilla Vial 1',
    fotoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
    observaciones: 'Cuadrilla enviada para aporte de ripio y motonivelación.'
  },
  {
    id: 'rec-002',
    codigo: 'REC-2026-082',
    titulo: 'Luminaria apagada en esquina noroeste',
    descripcion: 'Columna metálica de alumbrado público con reflector LED parpadeante desde el sábado pasado.',
    categoria: 'alumbrado',
    estado: 'cuadrilla_asignada',
    prioridad: 'media',
    fechaCreacion: '2026-10-14T20:15:00Z',
    fechaActualizacion: '2026-10-16T11:00:00Z',
    manzanaCodigo: 'M-045',
    calleId: 12,
    calleNombre: 'Acceso Central',
    ubicacionNombre: 'Manzana 45, Calle 12',
    coordenadas: [-64.2418, -27.7045],
    vecinoNombre: 'Silvia Noemí Herrera',
    vecinoTelefono: '+54 385 589-2104',
    cuadrillaAsignada: 'Cuadrilla Alumbrado',
    fotoUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80',
    observaciones: 'Reemplazo de driver LED programado para el turno tarde.'
  },
  {
    id: 'rec-003',
    codigo: 'REC-2026-083',
    titulo: 'Pérdida en cañería distribuidora de agua',
    descripcion: 'Brote de agua potable socavando la base de la cuneta. Riesgo de anegamiento en la vereda.',
    categoria: 'agua_cloacas',
    estado: 'recibido',
    prioridad: 'urgente',
    fechaCreacion: '2026-10-17T08:10:00Z',
    fechaActualizacion: '2026-10-17T08:10:00Z',
    manzanaCodigo: 'M-060',
    calleId: 24,
    calleNombre: 'Calle 24 (Ripio c/cuneta)',
    ubicacionNombre: 'Frente a Manzana 60',
    coordenadas: [-64.2472, -27.7012],
    vecinoNombre: 'María Teresa Rodríguez',
    vecinoTelefono: '+54 385 633-9012',
    observaciones: 'Prioridad máxima derivada a Obras Sanitarias Municipales.'
  },
  {
    id: 'rec-004',
    codigo: 'REC-2026-084',
    titulo: 'Desmalezado en lote baldío adyacente',
    descripcion: 'Malezas crecidas de más de 1.5m invadiendo la traza peatonal y generando foco de alimañas.',
    categoria: 'arbolado',
    estado: 'finalizado',
    prioridad: 'baja',
    fechaCreacion: '2026-10-10T11:00:00Z',
    fechaActualizacion: '2026-10-15T16:45:00Z',
    manzanaCodigo: 'Baldio 01',
    calleId: 8,
    ubicacionNombre: 'Sector Baldío 01 - Manzana 71',
    coordenadas: [-64.2431, -27.6989],
    vecinoNombre: 'Gustavo Maidana',
    vecinoTelefono: '+54 385 499-1234',
    cuadrillaAsignada: 'Cuadrilla Espacios Verdes',
    fotoUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=600&auto=format&fit=crop&q=80',
    observaciones: 'Trabajo concluido con desmalezadora y retiro de restos en camión recolector.'
  },
  {
    id: 'rec-005',
    codigo: 'REC-2026-085',
    titulo: 'Limpieza de cuneta obstruida por ramas y sedimentos',
    descripcion: 'La cuneta de hormigón está colmatada y no escurre el agua pluvial hacia el canal colector.',
    categoria: 'vialidad',
    estado: 'recibido',
    prioridad: 'media',
    fechaCreacion: '2026-10-16T15:20:00Z',
    fechaActualizacion: '2026-10-16T15:20:00Z',
    manzanaCodigo: 'M-048',
    calleId: 18,
    ubicacionNombre: 'Manzana 48 - Calle 18',
    coordenadas: [-64.2458, -27.7061],
    vecinoNombre: 'Roberto Castillo',
    vecinoTelefono: '+54 385 510-7788',
    observaciones: 'Inspección visual pendiente por parte de Capataz de Cuadrilla.'
  }
];

export const SEED_CUADRILLAS: Cuadrilla[] = [
  {
    id: 'cuad-1',
    nombre: 'Cuadrilla Vial 1 - Pavimentación y Ripio',
    responsable: 'Ing. Mateo Paz',
    tipo: 'vial',
    integrantes: 6,
    vehiculo: 'Motoniveladora Cat 120K + Camión Volcador Mercedes',
    estado: 'en_calle',
    trabajoActual: 'Nivelación de calzada en Manzana 39'
  },
  {
    id: 'cuad-2',
    nombre: 'Cuadrilla Alumbrado y Red Eléctrica',
    responsable: 'Téc. Lucas Morales',
    tipo: 'alumbrado',
    integrantes: 3,
    vehiculo: 'Camión Hidroelevador Ford F-4000',
    estado: 'disponible',
    trabajoActual: 'Guardia activa'
  },
  {
    id: 'cuad-3',
    nombre: 'Cuadrilla Espacios Verdes y Arbolado',
    responsable: 'Estela Giménez',
    tipo: 'espacios_verdes',
    integrantes: 5,
    vehiculo: 'Tractor con cortadora + Camión con caja abierta',
    estado: 'en_calle',
    trabajoActual: 'Desmalezado en inmediaciones del barrio'
  },
  {
    id: 'cuad-4',
    nombre: 'Cuadrilla de Saneamiento y Cunetas',
    responsable: 'Héctor Santillán',
    tipo: 'saneamiento',
    integrantes: 4,
    vehiculo: 'Minicargadora Bobcat + Pala y herramientas de mano',
    estado: 'disponible',
    trabajoActual: 'Base operativa'
  }
];

export const SEED_OBRAS: OrdenTrabajo[] = [
  {
    id: 'ot-101',
    codigo: 'OT-V-2026-031',
    titulo: 'Perfilado y compactación de rasante en calles de ripio',
    cuadrillaId: 'cuad-1',
    reclamoId: 'rec-001',
    calleId: 1,
    manzanaCodigo: 'M-039',
    fechaInicio: '2026-10-16',
    fechaEstimadaFin: '2026-10-18',
    estado: 'en_ejecucion',
    prioridad: 'alta'
  },
  {
    id: 'ot-102',
    codigo: 'OT-A-2026-015',
    titulo: 'Reconversión lumínica a LED 150W en traza perimetral',
    cuadrillaId: 'cuad-2',
    calleId: 12,
    manzanaCodigo: 'M-045',
    fechaInicio: '2026-10-17',
    fechaEstimadaFin: '2026-10-19',
    estado: 'programada',
    prioridad: 'media'
  }
];
