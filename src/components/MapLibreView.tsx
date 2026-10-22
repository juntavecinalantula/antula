import React, { useEffect, useRef, useState, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Layers,
  MapPin,
  Search,
  ZoomIn,
  ZoomOut,
  Compass,
  Eye,
  EyeOff,
  Filter,
  Plus,
  Flame,
  Construction,
  SlidersHorizontal,
  Box,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Palette,
  Sparkles,
  Info
} from 'lucide-react';
import { CalleFeature, ManzanaFeature, Reclamo } from '../types';

interface MapLibreViewProps {
  manzanasGeojson: any;
  callesGeojson: any;
  reclamos: Reclamo[];
  selectedManzana: ManzanaFeature['properties'] | null;
  onSelectManzana: (m: ManzanaFeature['properties'] | null) => void;
  selectedCalle: CalleFeature['properties'] | null;
  onSelectCalle: (c: CalleFeature['properties'] | null) => void;
  selectedReclamo: Reclamo | null;
  onSelectReclamo: (r: Reclamo | null) => void;
  onNewReclamoAtCoordinates: (coords: [number, number], info?: { manzana?: string; calleId?: number }) => void;
}

const BASEMAP_STYLES = [
  { id: 'positron', name: 'Positron Claro', url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json' },
  { id: 'dark', name: 'Dark Matter', url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json' },
  { id: 'voyager', name: 'Voyager Color', url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json' },
  {
    id: 'satellite',
    name: 'Satelital Esri',
    url: {
      version: 8,
      sources: {
        'esri-satellite': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256,
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        }
      },
      layers: [
        {
          id: 'esri-satellite-layer',
          type: 'raster',
          source: 'esri-satellite',
          minzoom: 0,
          maxzoom: 22
        }
      ]
    }
  }
];

export const MapLibreView: React.FC<MapLibreViewProps> = ({
  manzanasGeojson,
  callesGeojson,
  reclamos,
  selectedManzana,
  onSelectManzana,
  selectedCalle,
  onSelectCalle,
  selectedReclamo,
  onSelectReclamo,
  onNewReclamoAtCoordinates,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // 1. Basemap State
  const [activeBasemap, setActiveBasemap] = useState<string>('positron');
  const [showBasemapMenu, setShowBasemapMenu] = useState(false);

  // 2. Layer Visibility Toggles
  const [showManzanas, setShowManzanas] = useState(true);
  const [showManzanaLabels, setShowManzanaLabels] = useState(true);
  const [showCalles, setShowCalles] = useState(true);
  const [showCalleLabels, setShowCalleLabels] = useState(false);
  const [showReclamos, setShowReclamos] = useState(true);

  // 3. Layer Styling & Visualization Options
  const [manzanaOpacity, setManzanaOpacity] = useState<number>(0.25);
  const [manzanaThematic, setManzanaThematic] = useState<'estandar' | 'uso_suelo' | 'incidencias'>('estandar');
  const [manzana3DExtrusion, setManzana3DExtrusion] = useState<boolean>(false);

  const [calleOpacity, setCalleOpacity] = useState<number>(0.9);
  const [calleWidth, setCalleWidth] = useState<'fino' | 'medio' | 'grueso'>('medio');
  const [filtroPavimento, setFiltroPavimento] = useState<'todos' | 'asfalto' | 'ripio'>('todos');

  const [reclamosMode, setReclamosMode] = useState<'marcadores' | 'calor'>('marcadores');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('todas');

  // 4. Viewport & Tool States
  const [is3DMode, setIs3DMode] = useState(false);
  const [reportMode, setReportMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 5. Layer Control Panel UI States
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [panelTab, setPanelTab] = useState<'capas' | 'estilos' | 'leyenda'>('capas');

  // Center on Antula Barrio Municipal
  const ANTULA_CENTER: [number, number] = [-64.244057, -27.703225];
  const ANTULA_BBOX: [[number, number], [number, number]] = [
    [-64.251915, -27.711645],
    [-64.236199, -27.694806],
  ];

  // Filtered Reclamos list based on active category & priority filters
  const filteredReclamos = useMemo(() => {
    return reclamos.filter((r) => {
      if (!r.coordenadas) return false;
      if (filtroCategoria !== 'todas' && r.categoria !== filtroCategoria) return false;
      if (filtroPrioridad !== 'todas' && r.prioridad !== filtroPrioridad) return false;
      return true;
    });
  }, [reclamos, filtroCategoria, filtroPrioridad]);

  // Expression for Manzanas Fill Color
  const getManzanaColorExpression = () => {
    if (manzanaThematic === 'estandar') {
      return [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        '#2563eb',
        ['boolean', ['feature-state', 'hover'], false],
        '#60a5fa',
        '#3b82f6'
      ];
    }

    if (manzanaThematic === 'uso_suelo') {
      return [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        '#1d4ed8',
        ['boolean', ['feature-state', 'hover'], false],
        '#93c5fd',
        // Si el código o mza indica baldío
        ['in', 'baldio', ['downcase', ['coalesce', ['get', 'mza'], '']]],
        '#f59e0b', // Ámbar para baldíos
        ['in', 'fut-viv', ['downcase', ['coalesce', ['get', 'mza'], '']]],
        '#8b5cf6', // Violeta para futuras viviendas
        '#3b82f6' // Azul estándar para residencial
      ];
    }

    // Modo Incidencias: colorea según cantidad de reclamos asociados
    const countMap: Record<string, number> = {};
    reclamos.forEach((r) => {
      if (r.manzanaCodigo) {
        countMap[r.manzanaCodigo] = (countMap[r.manzanaCodigo] || 0) + 1;
      }
    });

    const matchCases: any[] = ['match', ['get', 'codigo']];
    Object.entries(countMap).forEach(([codigo, count]) => {
      matchCases.push(codigo);
      if (count >= 2) {
        matchCases.push('#ef4444'); // Rojo: 2 o más reclamos
      } else {
        matchCases.push('#f59e0b'); // Amarillo/Ámbar: 1 reclamo
      }
    });
    matchCases.push('#10b981'); // Verde: 0 reclamos

    return [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      '#1e40af',
      ['boolean', ['feature-state', 'hover'], false],
      '#38bdf8',
      matchCases
    ];
  };

  // Helper for street line width based on setting
  const getCalleLineWidth = () => {
    const mult = calleWidth === 'fino' ? 0.6 : calleWidth === 'grueso' ? 1.5 : 1.0;
    return [
      'interpolate',
      ['linear'],
      ['zoom'],
      13, 2 * mult,
      16, 5 * mult,
      18, 8 * mult
    ];
  };

  const getCalleCasingWidth = () => {
    const mult = calleWidth === 'fino' ? 0.6 : calleWidth === 'grueso' ? 1.5 : 1.0;
    return [
      'interpolate',
      ['linear'],
      ['zoom'],
      13, 3 * mult,
      16, 7 * mult,
      18, 11 * mult
    ];
  };

  // Helper to add all Vector Layers to the Map instance
  const addVectorLayers = (map: maplibregl.Map) => {
    // 1. Manzanas Source & Layers
    if (!map.getSource('manzanas-source') && manzanasGeojson) {
      map.addSource('manzanas-source', {
        type: 'geojson',
        data: manzanasGeojson,
        promoteId: 'id',
      });

      // Manzanas Fill (2D)
      map.addLayer({
        id: 'manzanas-fill',
        type: 'fill',
        source: 'manzanas-source',
        layout: {
          visibility: showManzanas && !manzana3DExtrusion ? 'visible' : 'none',
        },
        paint: {
          'fill-color': getManzanaColorExpression() as any,
          'fill-opacity': manzanaOpacity,
        },
      });

      // Manzanas 3D Extrusion
      map.addLayer({
        id: 'manzanas-extrusion',
        type: 'fill-extrusion',
        source: 'manzanas-source',
        layout: {
          visibility: showManzanas && manzana3DExtrusion ? 'visible' : 'none',
        },
        paint: {
          'fill-extrusion-color': getManzanaColorExpression() as any,
          'fill-extrusion-height': 14,
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': Math.min(0.9, manzanaOpacity + 0.35),
        },
      });

      // Manzanas Line Border
      map.addLayer({
        id: 'manzanas-line',
        type: 'line',
        source: 'manzanas-source',
        layout: {
          visibility: showManzanas ? 'visible' : 'none',
        },
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#1d4ed8',
            '#3b82f6'
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            3,
            1.5
          ],
        },
      });

      // Manzanas Labels (e.g. M-039)
      map.addLayer({
        id: 'manzanas-label',
        type: 'symbol',
        source: 'manzanas-source',
        minzoom: 14.2,
        layout: {
          visibility: showManzanas && showManzanaLabels ? 'visible' : 'none',
          'text-field': ['get', 'codigo'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            14.2, 9,
            16, 12,
            18, 14
          ],
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': '#1e293b',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.6,
        },
      });
    }

    // 2. Calles Source & Layers
    if (!map.getSource('calles-source') && callesGeojson) {
      map.addSource('calles-source', {
        type: 'geojson',
        data: callesGeojson,
        promoteId: 'id',
      });

      // Calles Casing
      map.addLayer({
        id: 'calles-casing',
        type: 'line',
        source: 'calles-source',
        layout: {
          visibility: showCalles ? 'visible' : 'none',
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#ffffff',
          'line-width': getCalleCasingWidth() as any,
          'line-opacity': Math.max(0.2, calleOpacity * 0.75),
        },
      });

      // Calles Core Line
      map.addLayer({
        id: 'calles-line',
        type: 'line',
        source: 'calles-source',
        layout: {
          visibility: showCalles ? 'visible' : 'none',
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': [
            'match',
            ['get', 'tipo'],
            1, '#2563eb', // Asfalto: Azul municipal vibrante
            2, '#d97706', // Ripio con cuneta: Ámbar cálido
            '#64748b'
          ],
          'line-width': getCalleLineWidth() as any,
          'line-opacity': calleOpacity,
          'line-dasharray': [
            'match',
            ['get', 'tipo'],
            2, ['literal', [2, 1]], // Ripio con trazo segmentado
            ['literal', [1, 0]]
          ]
        },
      });

      // Calles Labels (Calle N°)
      map.addLayer({
        id: 'calles-label',
        type: 'symbol',
        source: 'calles-source',
        minzoom: 15,
        layout: {
          visibility: showCalles && showCalleLabels ? 'visible' : 'none',
          'symbol-placement': 'line',
          'text-field': [
            'case',
            ['has', 'nombre'],
            ['get', 'nombre'],
            ['concat', 'Calle ', ['to-string', ['get', 'id']]]
          ],
          'text-size': 10,
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-letter-spacing': 0.1,
          'text-max-angle': 35,
        },
        paint: {
          'text-color': '#334155',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.8,
        }
      });

      // Calles Highlight on hover/select
      map.addLayer({
        id: 'calles-highlight',
        type: 'line',
        source: 'calles-source',
        layout: {
          visibility: showCalles ? 'visible' : 'none',
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#f43f5e',
          'line-width': 8,
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            0.7,
            ['boolean', ['feature-state', 'hover'], false],
            0.4,
            0
          ],
        },
      });
    }

    // 3. Reclamos Heatmap Source & Layer
    if (!map.getSource('reclamos-source')) {
      const geojsonFeatures = filteredReclamos.map((r) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: r.coordenadas!,
        },
        properties: {
          id: r.id,
          prioridad: r.prioridad,
          peso: r.prioridad === 'urgente' ? 2.5 : r.prioridad === 'alta' ? 1.8 : 1.0,
          categoria: r.categoria,
          estado: r.estado,
        },
      }));

      map.addSource('reclamos-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: geojsonFeatures as any,
        },
      });

      map.addLayer({
        id: 'reclamos-heat',
        type: 'heatmap',
        source: 'reclamos-source',
        maxzoom: 18.5,
        layout: {
          visibility: showReclamos && reclamosMode === 'calor' ? 'visible' : 'none',
        },
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'peso'],
            1, 0.8,
            2.5, 2.2
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            13, 1,
            16, 2.5
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0, 0, 0, 0)',
            0.2, '#38bdf8',
            0.4, '#34d399',
            0.6, '#fbbf24',
            0.8, '#f97316',
            1.0, '#ef4444'
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            13, 18,
            16, 38
          ],
          'heatmap-opacity': 0.85
        }
      });
    }
  };

  // Initialize Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const styleObj = BASEMAP_STYLES.find(s => s.id === activeBasemap)?.url || BASEMAP_STYLES[0].url;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: styleObj as any,
      center: ANTULA_CENTER,
      zoom: 15.6,
      minZoom: 13,
      maxZoom: 19,
      pitch: is3DMode ? 52 : 0,
      bearing: is3DMode ? -20 : 0,
      pitchWithRotate: true,
      attributionControl: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');

    let hoveredManzanaId: string | number | null = null;
    let hoveredCalleId: string | number | null = null;

    map.on('load', () => {
      addVectorLayers(map);
      mapRef.current = map;
    });

    // Interactivity: Manzanas (Fill & Extrusion)
    const handleManzanaHover = (e: any) => {
      if (e.features && e.features.length > 0) {
        map.getCanvas().style.cursor = 'pointer';
        if (hoveredManzanaId !== null) {
          map.setFeatureState({ source: 'manzanas-source', id: hoveredManzanaId }, { hover: false });
        }
        hoveredManzanaId = e.features[0].id || e.features[0].properties.id;
        if (hoveredManzanaId !== null) {
          map.setFeatureState({ source: 'manzanas-source', id: hoveredManzanaId }, { hover: true });
        }
      }
    };

    const handleManzanaLeave = () => {
      map.getCanvas().style.cursor = '';
      if (hoveredManzanaId !== null) {
        map.setFeatureState({ source: 'manzanas-source', id: hoveredManzanaId }, { hover: false });
        hoveredManzanaId = null;
      }
    };

    const handleManzanaClick = (e: any) => {
      if (reportMode) return;
      if (e.features && e.features.length > 0) {
        const feat = e.features[0];
        onSelectManzana(feat.properties as any);
        onSelectCalle(null);
      }
    };

    map.on('mousemove', 'manzanas-fill', handleManzanaHover);
    map.on('mouseleave', 'manzanas-fill', handleManzanaLeave);
    map.on('click', 'manzanas-fill', handleManzanaClick);

    map.on('mousemove', 'manzanas-extrusion', handleManzanaHover);
    map.on('mouseleave', 'manzanas-extrusion', handleManzanaLeave);
    map.on('click', 'manzanas-extrusion', handleManzanaClick);

    // Interactivity: Calles
    map.on('mousemove', 'calles-line', (e) => {
      if (e.features && e.features.length > 0) {
        map.getCanvas().style.cursor = 'pointer';
        if (hoveredCalleId !== null) {
          map.setFeatureState({ source: 'calles-source', id: hoveredCalleId }, { hover: false });
        }
        hoveredCalleId = e.features[0].id || e.features[0].properties.id;
        if (hoveredCalleId !== null) {
          map.setFeatureState({ source: 'calles-source', id: hoveredCalleId }, { hover: true });
        }
      }
    });

    map.on('mouseleave', 'calles-line', () => {
      map.getCanvas().style.cursor = '';
      if (hoveredCalleId !== null) {
        map.setFeatureState({ source: 'calles-source', id: hoveredCalleId }, { hover: false });
        hoveredCalleId = null;
      }
    });

    map.on('click', 'calles-line', (e) => {
      if (reportMode) return;
      if (e.features && e.features.length > 0) {
        const feat = e.features[0];
        onSelectCalle(feat.properties as any);
        onSelectManzana(null);
      }
    });

    // Interactivity: Click for Reporting or Deselection
    map.on('click', (e) => {
      if (reportMode) {
        const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
        const features = map.queryRenderedFeatures(e.point, { layers: ['manzanas-fill', 'manzanas-extrusion', 'calles-line'] });
        let mCode: string | undefined;
        let cId: number | undefined;

        features.forEach(f => {
          if (f.layer.id === 'manzanas-fill' || f.layer.id === 'manzanas-extrusion') mCode = f.properties.codigo;
          if (f.layer.id === 'calles-line') cId = f.properties.id;
        });

        onNewReclamoAtCoordinates(coords, { manzana: mCode, calleId: cId });
        setReportMode(false);
      } else {
        const feats = map.queryRenderedFeatures(e.point, { layers: ['manzanas-fill', 'manzanas-extrusion', 'calles-line'] });
        if (feats.length === 0) {
          onSelectManzana(null);
          onSelectCalle(null);
        }
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [activeBasemap]);

  // Update Dynamic Layers, Styles & Filters
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // 1. Manzanas Layer Properties
    if (map.getLayer('manzanas-fill')) {
      map.setLayoutProperty('manzanas-fill', 'visibility', showManzanas && !manzana3DExtrusion ? 'visible' : 'none');
      map.setPaintProperty('manzanas-fill', 'fill-opacity', manzanaOpacity);
      map.setPaintProperty('manzanas-fill', 'fill-color', getManzanaColorExpression() as any);
    }

    if (map.getLayer('manzanas-extrusion')) {
      map.setLayoutProperty('manzanas-extrusion', 'visibility', showManzanas && manzana3DExtrusion ? 'visible' : 'none');
      map.setPaintProperty('manzanas-extrusion', 'fill-extrusion-color', getManzanaColorExpression() as any);
      map.setPaintProperty('manzanas-extrusion', 'fill-extrusion-opacity', Math.min(0.9, manzanaOpacity + 0.35));
    }

    if (map.getLayer('manzanas-line')) {
      map.setLayoutProperty('manzanas-line', 'visibility', showManzanas ? 'visible' : 'none');
    }

    if (map.getLayer('manzanas-label')) {
      map.setLayoutProperty('manzanas-label', 'visibility', showManzanas && showManzanaLabels ? 'visible' : 'none');
    }

    // 2. Calles Layer Properties
    if (map.getLayer('calles-line')) {
      map.setLayoutProperty('calles-line', 'visibility', showCalles ? 'visible' : 'none');
      map.setLayoutProperty('calles-casing', 'visibility', showCalles ? 'visible' : 'none');
      map.setLayoutProperty('calles-highlight', 'visibility', showCalles ? 'visible' : 'none');
      if (map.getLayer('calles-label')) {
        map.setLayoutProperty('calles-label', 'visibility', showCalles && showCalleLabels ? 'visible' : 'none');
      }

      map.setPaintProperty('calles-line', 'line-opacity', calleOpacity);
      map.setPaintProperty('calles-casing', 'line-opacity', Math.max(0.2, calleOpacity * 0.75));
      map.setPaintProperty('calles-line', 'line-width', getCalleLineWidth() as any);
      map.setPaintProperty('calles-casing', 'line-width', getCalleCasingWidth() as any);

      // Pavement Filter
      let filterExpression: any = null;
      if (filtroPavimento === 'asfalto') {
        filterExpression = ['==', ['get', 'tipo'], 1];
      } else if (filtroPavimento === 'ripio') {
        filterExpression = ['==', ['get', 'tipo'], 2];
      }

      map.setFilter('calles-line', filterExpression);
      map.setFilter('calles-casing', filterExpression);
      if (map.getLayer('calles-label')) {
        map.setFilter('calles-label', filterExpression);
      }
    }

    // 3. Reclamos Heatmap Layer & Data Update
    if (map.getSource('reclamos-source')) {
      const geojsonFeatures = filteredReclamos.map((r) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: r.coordenadas!,
        },
        properties: {
          id: r.id,
          prioridad: r.prioridad,
          peso: r.prioridad === 'urgente' ? 2.5 : r.prioridad === 'alta' ? 1.8 : 1.0,
          categoria: r.categoria,
          estado: r.estado,
        },
      }));

      (map.getSource('reclamos-source') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: geojsonFeatures as any,
      });
    }

    if (map.getLayer('reclamos-heat')) {
      map.setLayoutProperty('reclamos-heat', 'visibility', showReclamos && reclamosMode === 'calor' ? 'visible' : 'none');
    }
  }, [
    showManzanas,
    showManzanaLabels,
    manzanaOpacity,
    manzanaThematic,
    manzana3DExtrusion,
    showCalles,
    showCalleLabels,
    calleOpacity,
    calleWidth,
    filtroPavimento,
    showReclamos,
    reclamosMode,
    filteredReclamos
  ]);

  // Update Feature Selection Highlights
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (selectedManzana?.id && map.getSource('manzanas-source')) {
      map.setFeatureState({ source: 'manzanas-source', id: selectedManzana.id }, { selected: true });
    }
    if (selectedCalle?.id && map.getSource('calles-source')) {
      map.setFeatureState({ source: 'calles-source', id: selectedCalle.id }, { selected: true });
    }
  }, [selectedManzana, selectedCalle]);

  // Render Reclamos Markers (When in 'marcadores' mode)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (!showReclamos || reclamosMode !== 'marcadores') return;

    filteredReclamos.forEach((rec) => {
      if (!rec.coordenadas) return;

      const el = document.createElement('div');
      el.className = 'group relative cursor-pointer';

      let bgCol = 'bg-blue-600 text-white';
      if (rec.prioridad === 'urgente') {
        bgCol = 'bg-rose-600 text-white ring-4 ring-rose-200 animate-pulse';
      } else if (rec.estado === 'finalizado') {
        bgCol = 'bg-emerald-600 text-white';
      } else if (rec.categoria === 'vialidad') {
        bgCol = 'bg-amber-600 text-white';
      }

      el.innerHTML = `
        <div class="flex items-center justify-center w-8 h-8 rounded-full ${bgCol} shadow-lg border-2 border-white transform transition-transform hover:scale-125">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectReclamo(rec);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(rec.coordenadas)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [filteredReclamos, showReclamos, reclamosMode]);

  // Toggle 3D Perspective Mode
  const handleToggle3D = () => {
    const next3D = !is3DMode;
    setIs3DMode(next3D);
    if (mapRef.current) {
      mapRef.current.easeTo({
        pitch: next3D ? 52 : 0,
        bearing: next3D ? -20 : 0,
        duration: 1000,
      });
    }
  };

  // Search feature to fly to Manzana or Calle
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !manzanasGeojson) return;

    const query = searchQuery.trim().toLowerCase();
    const foundManzana = manzanasGeojson.features.find((f: any) =>
      f.properties.codigo?.toLowerCase().includes(query) ||
      f.properties.nombre?.toLowerCase().includes(query)
    );

    if (foundManzana && mapRef.current) {
      onSelectManzana(foundManzana.properties);
      const firstCoord = foundManzana.geometry.coordinates[0][0];
      mapRef.current.flyTo({
        center: firstCoord,
        zoom: 17.5,
        essential: true,
      });
    }
  };

  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.fitBounds(ANTULA_BBOX, { padding: 40, duration: 1000 });
      if (is3DMode) {
        setIs3DMode(false);
        mapRef.current.easeTo({ pitch: 0, bearing: 0, duration: 800 });
      }
    }
  };

  // Reset layer styles to default
  const handleResetLayerStyles = () => {
    setShowManzanas(true);
    setShowManzanaLabels(true);
    setShowCalles(true);
    setShowCalleLabels(false);
    setShowReclamos(true);
    setManzanaOpacity(0.25);
    setManzanaThematic('estandar');
    setManzana3DExtrusion(false);
    setCalleOpacity(0.9);
    setCalleWidth('medio');
    setFiltroPavimento('todos');
    setReclamosMode('marcadores');
    setFiltroCategoria('todas');
    setFiltroPrioridad('todas');
  };

  const activeLayersCount = (showManzanas ? 1 : 0) + (showCalles ? 1 : 0) + (showReclamos ? 1 : 0);

  return (
    <div className="relative w-full h-full min-h-[600px] flex overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm bg-white">
      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="pointer-events-auto flex items-center bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200/80 px-3 py-1.5 w-72 md:w-80">
          <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            placeholder="Buscar manzana (ej: M-039)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm bg-transparent outline-none text-slate-800 placeholder-slate-400 font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-400 hover:text-slate-600 px-1"
            >
              ×
            </button>
          )}
        </form>

        {/* Action Buttons Top Right */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Report Button Toggle */}
          <button
            onClick={() => setReportMode(!reportMode)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              reportMode
                ? 'bg-rose-600 text-white ring-4 ring-rose-200 animate-pulse'
                : 'bg-brand-600 hover:bg-brand-700 text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{reportMode ? 'Haz click en el mapa' : 'Reportar en Punto'}</span>
          </button>

          {/* Quick Toggle Layer Panel */}
          <button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shadow-md border transition-all ${
              isPanelOpen
                ? 'bg-brand-50 border-brand-200 text-brand-700 font-bold'
                : 'bg-white/95 backdrop-blur-md hover:bg-slate-50 text-slate-700 border-slate-200/80'
            }`}
            title="Panel de Capas y Visualización"
          >
            <Layers className="w-3.5 h-3.5 text-brand-600" />
            <span className="hidden sm:inline">Capas SIG</span>
            <span className="px-1.5 py-0.2 rounded-full bg-brand-100 text-brand-800 text-[10px] font-bold">
              {activeLayersCount}
            </span>
          </button>

          {/* Basemap Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowBasemapMenu(!showBasemapMenu)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/95 backdrop-blur-md hover:bg-slate-50 text-slate-700 rounded-xl shadow-md border border-slate-200/80 text-xs font-semibold"
              title="Cambiar mapa base cartográfico"
            >
              <Palette className="w-3.5 h-3.5 text-brand-600" />
              <span className="hidden sm:inline">Mapa Base</span>
            </button>

            {showBasemapMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-30 animate-in fade-in slide-in-from-top-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">Estilo Cartográfico</div>
                {BASEMAP_STYLES.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setActiveBasemap(b.id);
                      setShowBasemapMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs rounded-lg font-medium transition-colors ${
                      activeBasemap === b.id
                        ? 'bg-brand-50 text-brand-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full relative" />

      {/* Floating Map Navigation Controls (Bottom Right) */}
      <div className="absolute right-4 bottom-8 z-20 flex flex-col gap-2">
        {/* 2D / 3D Perspective Toggle Button */}
        <button
          onClick={handleToggle3D}
          className={`p-2.5 rounded-xl shadow-lg border backdrop-blur-md transition-all flex items-center justify-center ${
            is3DMode
              ? 'bg-brand-600 text-white border-brand-700 ring-2 ring-brand-200'
              : 'bg-white/95 hover:bg-white text-slate-700 border-slate-200/80 hover:text-brand-600'
          }`}
          title={is3DMode ? 'Cambiar a Vista 2D Plana' : 'Cambiar a Perspectiva 3D'}
        >
          <Box className="w-4 h-4" />
        </button>

        {/* Quick Heatmap Toggle */}
        <button
          onClick={() => {
            if (!showReclamos) setShowReclamos(true);
            setReclamosMode(reclamosMode === 'calor' ? 'marcadores' : 'calor');
          }}
          className={`p-2.5 rounded-xl shadow-lg border backdrop-blur-md transition-all flex items-center justify-center ${
            showReclamos && reclamosMode === 'calor'
              ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-200 animate-pulse'
              : 'bg-white/95 hover:bg-white text-slate-700 border-slate-200/80 hover:text-amber-600'
          }`}
          title={reclamosMode === 'calor' ? 'Modo Marcadores de Reclamos' : 'Modo Mapa de Calor (Heatmap)'}
        >
          <Flame className="w-4 h-4" />
        </button>

        <button
          onClick={() => mapRef.current?.zoomIn()}
          className="p-2.5 bg-white/95 backdrop-blur-md hover:bg-white text-slate-700 rounded-xl shadow-lg border border-slate-200/80 hover:text-brand-600 transition-colors"
          title="Acercar"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          className="p-2.5 bg-white/95 backdrop-blur-md hover:bg-white text-slate-700 rounded-xl shadow-lg border border-slate-200/80 hover:text-brand-600 transition-colors"
          title="Alejar"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetView}
          className="p-2.5 bg-white/95 backdrop-blur-md hover:bg-white text-slate-700 rounded-xl shadow-lg border border-slate-200/80 hover:text-brand-600 transition-colors"
          title="Centrar en Antula"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* Modern Floating Layer Visualization Panel (Bottom Left) */}
      {isPanelOpen ? (
        <div className="absolute left-4 bottom-8 z-20 w-[350px] max-w-[calc(100vw-2rem)] max-h-[75vh] flex flex-col bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in slide-in-from-bottom-3">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900 text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400" />
              <div>
                <h3 className="text-xs font-bold leading-tight">Control de Capas SIG</h3>
                <span className="text-[10px] text-slate-400 leading-tight">Opciones de visualización</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleResetLayerStyles}
                className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
                title="Restablecer estilos predeterminados"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsPanelOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
                title="Minimizar panel"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200/80 bg-slate-50/80 text-xs font-bold px-2 pt-1 gap-1 flex-shrink-0">
            <button
              onClick={() => setPanelTab('capas')}
              className={`flex-1 py-1.5 px-2 rounded-t-lg transition-colors flex items-center justify-center gap-1.5 ${
                panelTab === 'capas'
                  ? 'bg-white text-brand-700 border-t border-x border-slate-200/80 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Capas</span>
            </button>
            <button
              onClick={() => setPanelTab('estilos')}
              className={`flex-1 py-1.5 px-2 rounded-t-lg transition-colors flex items-center justify-center gap-1.5 ${
                panelTab === 'estilos'
                  ? 'bg-white text-brand-700 border-t border-x border-slate-200/80 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Estilos & 3D</span>
            </button>
            <button
              onClick={() => setPanelTab('leyenda')}
              className={`flex-1 py-1.5 px-2 rounded-t-lg transition-colors flex items-center justify-center gap-1.5 ${
                panelTab === 'leyenda'
                  ? 'bg-white text-brand-700 border-t border-x border-slate-200/80 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Leyenda</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="p-3.5 overflow-y-auto space-y-3.5 text-xs">
            {/* TAB 1: CAPAS & VISIBILIDAD */}
            {panelTab === 'capas' && (
              <div className="space-y-3">
                {/* 1. Capa Manzanas */}
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                      <span className="w-3.5 h-3.5 rounded bg-blue-100 border border-blue-500 inline-block"></span>
                      <span>Manzanas Catastrales</span>
                      <span className="text-[10px] text-slate-400 font-normal">(132)</span>
                    </label>
                    <input
                      type="checkbox"
                      checked={showManzanas}
                      onChange={(e) => setShowManzanas(e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                    />
                  </div>

                  {showManzanas && (
                    <div className="pl-5 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
                      <span>Rótulos de código (ej: M-039)</span>
                      <input
                        type="checkbox"
                        checked={showManzanaLabels}
                        onChange={(e) => setShowManzanaLabels(e.target.checked)}
                        className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* 2. Capa Calles */}
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                      <span className="w-3.5 h-1 rounded bg-slate-700 inline-block"></span>
                      <span>Trazado Vial / Calles</span>
                      <span className="text-[10px] text-slate-400 font-normal">(70)</span>
                    </label>
                    <input
                      type="checkbox"
                      checked={showCalles}
                      onChange={(e) => setShowCalles(e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                    />
                  </div>

                  {showCalles && (
                    <div className="space-y-2 pt-1 border-t border-slate-200/60">
                      {/* Filtro por Pavimento */}
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block mb-1">Filtrar por Pavimento:</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setFiltroPavimento('todos')}
                            className={`flex-1 py-1 px-1.5 rounded text-[10px] font-bold transition-colors ${
                              filtroPavimento === 'todos'
                                ? 'bg-slate-800 text-white'
                                : 'bg-slate-200/70 text-slate-700 hover:bg-slate-300'
                            }`}
                          >
                            Todas (70)
                          </button>
                          <button
                            onClick={() => setFiltroPavimento('asfalto')}
                            className={`flex-1 py-1 px-1.5 rounded text-[10px] font-bold transition-colors flex items-center justify-center gap-1 ${
                              filtroPavimento === 'asfalto'
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            Asfalto (29)
                          </button>
                          <button
                            onClick={() => setFiltroPavimento('ripio')}
                            className={`flex-1 py-1 px-1.5 rounded text-[10px] font-bold transition-colors flex items-center justify-center gap-1 ${
                              filtroPavimento === 'ripio'
                                ? 'bg-amber-600 text-white'
                                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Ripio (41)
                          </button>
                        </div>
                      </div>

                      {/* Rótulos de Calles */}
                      <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                        <span>Mostrar nombres / numeración de calles</span>
                        <input
                          type="checkbox"
                          checked={showCalleLabels}
                          onChange={(e) => setShowCalleLabels(e.target.checked)}
                          className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Capa Reclamos e Incidentes */}
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                      <span className="w-3.5 h-3.5 rounded-full bg-rose-500 border border-white shadow-xs inline-block"></span>
                      <span>Reclamos e Incidentes</span>
                      <span className="text-[10px] text-slate-400 font-normal">({reclamos.length})</span>
                    </label>
                    <input
                      type="checkbox"
                      checked={showReclamos}
                      onChange={(e) => setShowReclamos(e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                    />
                  </div>

                  {showReclamos && (
                    <div className="space-y-2 pt-1 border-t border-slate-200/60">
                      {/* Modo de Representación */}
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block mb-1">Modo de Visualización:</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => setReclamosMode('marcadores')}
                            className={`py-1 px-2 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1 border ${
                              reclamosMode === 'marcadores'
                                ? 'bg-brand-50 border-brand-300 text-brand-700 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <MapPin className="w-3 h-3 text-brand-600" />
                            Marcadores
                          </button>
                          <button
                            onClick={() => setReclamosMode('calor')}
                            className={`py-1 px-2 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1 border ${
                              reclamosMode === 'calor'
                                ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <Flame className="w-3 h-3 text-amber-600" />
                            Mapa de Calor
                          </button>
                        </div>
                      </div>

                      {/* Filtro por Categoría */}
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Categoría:</label>
                          <select
                            value={filtroCategoria}
                            onChange={(e) => setFiltroCategoria(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 outline-none font-medium"
                          >
                            <option value="todas">Todas ({reclamos.length})</option>
                            <option value="vialidad">Vialidad</option>
                            <option value="alumbrado">Alumbrado</option>
                            <option value="agua_cloacas">Agua / Cloacas</option>
                            <option value="arbolado">Arbolado</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Prioridad:</label>
                          <select
                            value={filtroPrioridad}
                            onChange={(e) => setFiltroPrioridad(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 outline-none font-medium"
                          >
                            <option value="todas">Todas</option>
                            <option value="urgente">Solo Urgentes</option>
                            <option value="alta">Altas y Urgentes</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: ESTILOS, OPACIDAD & 3D */}
            {panelTab === 'estilos' && (
              <div className="space-y-3.5">
                {/* 1. Manzanas Styling */}
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Manzanas: Opacidad & Tematización</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                      {Math.round(manzanaOpacity * 100)}%
                    </span>
                  </div>

                  {/* Slider Opacidad */}
                  <div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.8"
                      step="0.05"
                      value={manzanaOpacity}
                      onChange={(e) => setManzanaOpacity(parseFloat(e.target.value))}
                      className="w-full accent-brand-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>

                  {/* Modo Temático */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">Coloración Temática:</span>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => setManzanaThematic('estandar')}
                        className={`py-1 px-1 rounded text-[10px] font-bold transition-colors border ${
                          manzanaThematic === 'estandar'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Estándar
                      </button>
                      <button
                        onClick={() => setManzanaThematic('uso_suelo')}
                        className={`py-1 px-1 rounded text-[10px] font-bold transition-colors border ${
                          manzanaThematic === 'uso_suelo'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Uso Suelo
                      </button>
                      <button
                        onClick={() => setManzanaThematic('incidencias')}
                        className={`py-1 px-1 rounded text-[10px] font-bold transition-colors border ${
                          manzanaThematic === 'incidencias'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Reclamos
                      </button>
                    </div>
                  </div>

                  {/* Extrusión 3D */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-700">
                      <Box className="w-3.5 h-3.5 text-brand-600" />
                      <span>Extrusión 3D de Manzanas</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={manzana3DExtrusion}
                      onChange={(e) => {
                        setManzana3DExtrusion(e.target.checked);
                        if (e.target.checked && !is3DMode) {
                          handleToggle3D();
                        }
                      }}
                      className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                    />
                  </div>
                </div>

                {/* 2. Calles Styling */}
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Calles: Grosor & Opacidad</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded">
                      {Math.round(calleOpacity * 100)}%
                    </span>
                  </div>

                  {/* Slider Opacidad Calles */}
                  <div>
                    <input
                      type="range"
                      min="0.2"
                      max="1.0"
                      step="0.05"
                      value={calleOpacity}
                      onChange={(e) => setCalleOpacity(parseFloat(e.target.value))}
                      className="w-full accent-slate-800 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>

                  {/* Grosor de Línea */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">Grosor de Traza Vial:</span>
                    <div className="grid grid-cols-3 gap-1">
                      {(['fino', 'medio', 'grueso'] as const).map((w) => (
                        <button
                          key={w}
                          onClick={() => setCalleWidth(w)}
                          className={`py-1 px-1.5 rounded text-[10px] font-bold capitalize transition-colors border ${
                            calleWidth === w
                              ? 'bg-slate-800 text-white border-slate-800'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Cámara & Perspectiva */}
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">Perspectiva 3D</span>
                    <span className="text-[10px] text-slate-400">Inclinación a 50° para vista volumétrica</span>
                  </div>
                  <button
                    onClick={handleToggle3D}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                      is3DMode
                        ? 'bg-brand-600 text-white border-brand-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {is3DMode ? '3D Activo' : '2D Plano'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: LEYENDA DINÁMICA */}
            {panelTab === 'leyenda' && (
              <div className="space-y-3">
                {/* Red Vial */}
                <div>
                  <span className="text-[11px] font-bold text-slate-800 block mb-1.5">Red Vial y Pavimentos</span>
                  <div className="space-y-1 bg-white p-2 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-1 bg-blue-600 rounded"></span>
                      <span className="text-[11px] text-slate-700">Calle Asfaltada (29 segmentos)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-1 border-t-2 border-dashed border-amber-600"></span>
                      <span className="text-[11px] text-slate-700">Calle de Ripio c/ Cuneta (41 segmentos)</span>
                    </div>
                  </div>
                </div>

                {/* Manzanas según temática */}
                <div>
                  <span className="text-[11px] font-bold text-slate-800 block mb-1.5">
                    Manzanas ({manzanaThematic === 'estandar' ? 'Estándar' : manzanaThematic === 'uso_suelo' ? 'Uso de Suelo' : 'Incidencias'})
                  </span>
                  <div className="space-y-1 bg-white p-2 rounded-xl border border-slate-100">
                    {manzanaThematic === 'estandar' && (
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 bg-blue-500/30 border border-blue-600 rounded"></span>
                        <span className="text-[11px] text-slate-700">Catastro Municipal Regular</span>
                      </div>
                    )}
                    {manzanaThematic === 'uso_suelo' && (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 bg-blue-500/40 border border-blue-600 rounded"></span>
                          <span className="text-[11px] text-slate-700">Manzana Residencial Habitada</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 bg-amber-500/40 border border-amber-600 rounded"></span>
                          <span className="text-[11px] text-slate-700">Lote Baldío / Espacio Abierto</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 bg-purple-500/40 border border-purple-600 rounded"></span>
                          <span className="text-[11px] text-slate-700">Futuras Viviendas Proyectadas</span>
                        </div>
                      </>
                    )}
                    {manzanaThematic === 'incidencias' && (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 bg-emerald-500/40 border border-emerald-600 rounded"></span>
                          <span className="text-[11px] text-slate-700">0 Reclamos (Normal)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 bg-amber-500/40 border border-amber-600 rounded"></span>
                          <span className="text-[11px] text-slate-700">1 Reclamo Registrado</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 bg-rose-500/40 border border-rose-600 rounded"></span>
                          <span className="text-[11px] text-slate-700">2 o más Reclamos (Foco de atención)</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Reclamos */}
                <div>
                  <span className="text-[11px] font-bold text-slate-800 block mb-1.5">
                    {reclamosMode === 'marcadores' ? 'Simbología de Reclamos' : 'Gradiente Mapa de Calor'}
                  </span>
                  <div className="space-y-1.5 bg-white p-2 rounded-xl border border-slate-100">
                    {reclamosMode === 'marcadores' ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-rose-600 ring-2 ring-rose-200"></span>
                          <span className="text-[11px] text-slate-700">Prioridad Urgente</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-amber-600"></span>
                          <span className="text-[11px] text-slate-700">Vialidad / Obras</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                          <span className="text-[11px] text-slate-700">Alumbrado / Agua / Otros</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                          <span className="text-[11px] text-slate-700">Finalizado / Reparado</span>
                        </div>
                      </>
                    ) : (
                      <div>
                        <div className="h-3 w-full rounded-md bg-gradient-to-r from-sky-400 via-amber-400 to-rose-600 mb-1"></div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                          <span>Baja Densidad</span>
                          <span>Media</span>
                          <span>Alta Concentración</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Minimized Floating Button Pill */
        <button
          onClick={() => setIsPanelOpen(true)}
          className="absolute left-4 bottom-8 z-20 flex items-center gap-2 px-3.5 py-2.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-all hover:scale-105"
        >
          <Layers className="w-4 h-4 text-brand-600" />
          <span>Capas & Simbología</span>
          <span className="px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-700 text-[10px]">
            {activeLayersCount} activas
          </span>
        </button>
      )}

      {/* Selected Feature Card Drawer (When Manzana, Calle, or Reclamo is clicked) */}
      {(selectedManzana || selectedCalle || selectedReclamo) && (
        <div className="absolute top-18 right-4 z-20 w-80 max-h-[80vh] overflow-y-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 p-4 animate-in fade-in slide-in-from-right-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600">
              {selectedManzana ? 'Manzana Catastral' : selectedCalle ? 'Segmento de Calle' : 'Detalle de Reclamo'}
            </span>
            <button
              onClick={() => {
                onSelectManzana(null);
                onSelectCalle(null);
                onSelectReclamo(null);
              }}
              className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1 rounded-md"
            >
              ×
            </button>
          </div>

          {/* Manzana Details */}
          {selectedManzana && (
            <div className="pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-800 font-display">{selectedManzana.codigo}</h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                  {selectedManzana.tipo || 'Catastro'}
                </span>
              </div>
              <p className="text-xs text-slate-600">{selectedManzana.nombre || 'Manzana Urbana en Antula'}</p>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">ID Técnico</span>
                  <span className="font-bold text-slate-700">#{selectedManzana.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">N° Manzana (MZA)</span>
                  <span className="font-bold text-slate-700">{selectedManzana.mza || 'S/N'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Superficie Est.</span>
                  <span className="font-bold text-slate-700">
                    {selectedManzana.superficie_m2 ? `${Math.round(selectedManzana.superficie_m2)} m²` : '~4,200 m²'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Perímetro</span>
                  <span className="font-bold text-slate-700">
                    {selectedManzana.perimetro_m ? `${Math.round(selectedManzana.perimetro_m)} m` : '~260 m'}
                  </span>
                </div>
              </div>

              {/* Action to create claim for this block */}
              <button
                onClick={() => {
                  onNewReclamoAtCoordinates(ANTULA_CENTER, { manzana: selectedManzana.codigo });
                }}
                className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Registrar Reclamo en {selectedManzana.codigo}
              </button>
            </div>
          )}

          {/* Calle Details */}
          {selectedCalle && (
            <div className="pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-800 font-display">
                  {selectedCalle.nombre || `Calle Tramo #${selectedCalle.id}`}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedCalle.tipo === 1
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedCalle.tipo === 1 ? 'Asfalto' : 'Ripio c/ Cuneta'}
                </span>
              </div>

              <div className="space-y-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">Jerarquía:</span>
                  <span className="font-semibold text-slate-700 capitalize">{selectedCalle.jerarquia || 'Calle Local'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sentido:</span>
                  <span className="font-semibold text-slate-700 capitalize">{selectedCalle.sentido || 'Doble mano'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estado Pavimento:</span>
                  <span className="font-semibold text-slate-700 capitalize">{selectedCalle.estado || 'Regular'}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onNewReclamoAtCoordinates(ANTULA_CENTER, { calleId: selectedCalle.id });
                }}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Construction className="w-3.5 h-3.5" />
                Reportar Trabajo o Bache en Calle #{selectedCalle.id}
              </button>
            </div>
          )}

          {/* Reclamo Details */}
          {selectedReclamo && (
            <div className="pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">{selectedReclamo.codigo}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedReclamo.estado === 'finalizado'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedReclamo.prioridad === 'urgente'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {selectedReclamo.estado.replace('_', ' ')}
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-800">{selectedReclamo.titulo}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{selectedReclamo.descripcion}</p>

              {selectedReclamo.fotoUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <img src={selectedReclamo.fotoUrl} alt="Evidencia" className="w-full h-32 object-cover" />
                </div>
              )}

              <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50 p-2 rounded-xl">
                <div><strong>Vecino:</strong> {selectedReclamo.vecinoNombre}</div>
                <div><strong>Ubicación:</strong> {selectedReclamo.ubicacionNombre}</div>
                {selectedReclamo.cuadrillaAsignada && (
                  <div><strong>Cuadrilla:</strong> {selectedReclamo.cuadrillaAsignada}</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
