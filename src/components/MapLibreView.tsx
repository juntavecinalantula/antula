import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Layers, MapPin, Search, ZoomIn, ZoomOut, Compass, Eye, Filter, Plus, CheckCircle2, AlertTriangle, Flame, Droplets, Lightbulb, Construction } from 'lucide-react';
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
    name: 'Satelital',
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

  const [activeBasemap, setActiveBasemap] = useState<string>('positron');
  const [showBasemapMenu, setShowBasemapMenu] = useState(false);
  const [showManzanas, setShowManzanas] = useState(true);
  const [showCalles, setShowCalles] = useState(true);
  const [filtroPavimento, setFiltroPavimento] = useState<'todos' | 'asfalto' | 'ripio'>('todos');
  const [showReclamos, setShowReclamos] = useState(true);
  const [reportMode, setReportMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Center on Antula Barrio Municipal
  const ANTULA_CENTER: [number, number] = [-64.244057, -27.703225];
  const ANTULA_BBOX: [[number, number], [number, number]] = [
    [-64.251915, -27.711645],
    [-64.236199, -27.694806],
  ];

  // Helper to add GeoJSON layers to the map
  const addVectorLayers = (map: maplibregl.Map) => {
    // 1. Manzanas Source & Layers
    if (!map.getSource('manzanas-source') && manzanasGeojson) {
      map.addSource('manzanas-source', {
        type: 'geojson',
        data: manzanasGeojson,
        promoteId: 'id',
      });

      // Manzanas Fill
      map.addLayer({
        id: 'manzanas-fill',
        type: 'fill',
        source: 'manzanas-source',
        layout: {
          visibility: showManzanas ? 'visible' : 'none',
        },
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#2563eb',
            ['boolean', ['feature-state', 'hover'], false],
            '#60a5fa',
            '#3b82f6'
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            0.5,
            ['boolean', ['feature-state', 'hover'], false],
            0.35,
            0.12
          ],
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
        minzoom: 14.5,
        layout: {
          visibility: showManzanas ? 'visible' : 'none',
          'text-field': ['get', 'codigo'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            14.5, 9,
            16, 12,
            18, 14
          ],
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': '#1e293b',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5,
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

      // Calles Casing (outer border for contrast)
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
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            13, 3,
            16, 7,
            18, 11
          ],
          'line-opacity': 0.8,
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
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            13, 2,
            16, 5,
            18, 8
          ],
          'line-dasharray': [
            'match',
            ['get', 'tipo'],
            2, ['literal', [2, 1]], // Línea con sutil patrón para ripio
            ['literal', [1, 0]]
          ]
        },
      });

      // Calles Hover / Selected Highlight
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
  };

  // Initialize Map
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

    // Interactivity: Manzanas
    map.on('mousemove', 'manzanas-fill', (e) => {
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
    });

    map.on('mouseleave', 'manzanas-fill', () => {
      map.getCanvas().style.cursor = '';
      if (hoveredManzanaId !== null) {
        map.setFeatureState({ source: 'manzanas-source', id: hoveredManzanaId }, { hover: false });
        hoveredManzanaId = null;
      }
    });

    map.on('click', 'manzanas-fill', (e) => {
      if (reportMode) return;
      if (e.features && e.features.length > 0) {
        const feat = e.features[0];
        onSelectManzana(feat.properties as any);
        onSelectCalle(null);
      }
    });

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

    // Click anywhere on map for Reporting or Deselection
    map.on('click', (e) => {
      if (reportMode) {
        const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
        // Try to find if clicked inside a manzana or near a calle
        const features = map.queryRenderedFeatures(e.point, { layers: ['manzanas-fill', 'calles-line'] });
        let mCode: string | undefined;
        let cId: number | undefined;

        features.forEach(f => {
          if (f.layer.id === 'manzanas-fill') mCode = f.properties.codigo;
          if (f.layer.id === 'calles-line') cId = f.properties.id;
        });

        onNewReclamoAtCoordinates(coords, { manzana: mCode, calleId: cId });
        setReportMode(false);
      } else {
        const feats = map.queryRenderedFeatures(e.point, { layers: ['manzanas-fill', 'calles-line'] });
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

  // Update layer visibility and filters
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (map.getLayer('manzanas-fill')) {
      map.setLayoutProperty('manzanas-fill', 'visibility', showManzanas ? 'visible' : 'none');
      map.setLayoutProperty('manzanas-line', 'visibility', showManzanas ? 'visible' : 'none');
      map.setLayoutProperty('manzanas-label', 'visibility', showManzanas ? 'visible' : 'none');
    }

    if (map.getLayer('calles-line')) {
      map.setLayoutProperty('calles-line', 'visibility', showCalles ? 'visible' : 'none');
      map.setLayoutProperty('calles-casing', 'visibility', showCalles ? 'visible' : 'none');
      map.setLayoutProperty('calles-highlight', 'visibility', showCalles ? 'visible' : 'none');

      // Filter by paving
      if (filtroPavimento === 'asfalto') {
        map.setFilter('calles-line', ['==', ['get', 'tipo'], 1]);
        map.setFilter('calles-casing', ['==', ['get', 'tipo'], 1]);
      } else if (filtroPavimento === 'ripio') {
        map.setFilter('calles-line', ['==', ['get', 'tipo'], 2]);
        map.setFilter('calles-casing', ['==', ['get', 'tipo'], 2]);
      } else {
        map.setFilter('calles-line', null);
        map.setFilter('calles-casing', null);
      }
    }
  }, [showManzanas, showCalles, filtroPavimento]);

  // Update Selected States
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // Reset previous selections
    if (selectedManzana?.id && map.getSource('manzanas-source')) {
      map.setFeatureState({ source: 'manzanas-source', id: selectedManzana.id }, { selected: true });
    }
    if (selectedCalle?.id && map.getSource('calles-source')) {
      map.setFeatureState({ source: 'calles-source', id: selectedCalle.id }, { selected: true });
    }
  }, [selectedManzana, selectedCalle]);

  // Render Reclamos Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (!showReclamos) return;

    reclamos.forEach((rec) => {
      if (!rec.coordenadas) return;

      const el = document.createElement('div');
      el.className = 'group relative cursor-pointer';

      // Badge color based on category and priority
      let bgCol = 'bg-blue-600 text-white';
      if (rec.prioridad === 'urgente') bgCol = 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-200';
      else if (rec.estado === 'finalizado') bgCol = 'bg-emerald-600 text-white';
      else if (rec.categoria === 'vialidad') bgCol = 'bg-amber-600 text-white';

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
  }, [reclamos, showReclamos]);

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
      // Zoom to first coordinate of polygon
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
    }
  };

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

        {/* Action Buttons */}
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

          {/* Basemap Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowBasemapMenu(!showBasemapMenu)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/95 backdrop-blur-md hover:bg-slate-50 text-slate-700 rounded-xl shadow-md border border-slate-200/80 text-xs font-semibold"
              title="Cambiar capa base"
            >
              <Layers className="w-3.5 h-3.5 text-brand-600" />
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

      {/* Floating Map Navigation Controls */}
      <div className="absolute right-4 bottom-8 z-20 flex flex-col gap-2">
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

      {/* Legend & Layers Control Panel (Bottom Left) */}
      <div className="absolute left-4 bottom-8 z-20 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 p-3 max-w-xs text-xs">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-brand-600" />
            Capas & Pavimento
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">SIG Antula</span>
        </div>

        {/* Toggles */}
        <div className="space-y-1.5">
          <label className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1 rounded-lg">
            <span className="flex items-center gap-2 text-slate-700">
              <span className="w-3.5 h-3.5 rounded bg-blue-100 border border-blue-500 inline-block"></span>
              Manzanas (132)
            </span>
            <input
              type="checkbox"
              checked={showManzanas}
              onChange={(e) => setShowManzanas(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1 rounded-lg">
            <span className="flex items-center gap-2 text-slate-700">
              <span className="w-3.5 h-1 rounded bg-slate-700 inline-block"></span>
              Trazado Calles (70)
            </span>
            <input
              type="checkbox"
              checked={showCalles}
              onChange={(e) => setShowCalles(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
            />
          </label>

          {/* Filter Pavimento */}
          {showCalles && (
            <div className="pl-4 pt-1 flex gap-1">
              <button
                onClick={() => setFiltroPavimento('todos')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                  filtroPavimento === 'todos' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFiltroPavimento('asfalto')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors flex items-center gap-1 ${
                  filtroPavimento === 'asfalto' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                Asfalto (29)
              </button>
              <button
                onClick={() => setFiltroPavimento('ripio')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors flex items-center gap-1 ${
                  filtroPavimento === 'ripio' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                Ripio (41)
              </button>
            </div>
          )}

          <label className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1 rounded-lg">
            <span className="flex items-center gap-2 text-slate-700">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-500 border border-white shadow-xs inline-block"></span>
              Reclamos Activos ({reclamos.length})
            </span>
            <input
              type="checkbox"
              checked={showReclamos}
              onChange={(e) => setShowReclamos(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
            />
          </label>
        </div>
      </div>

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
