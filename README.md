# Antula - Plataforma de Gestión Municipal & Catastro Territorial 🏛️🗺️

Plataforma moderna de **Gestión Municipal Territorial y Atención Ciudadana** inspirada en [Munify Gestión](https://mi.munify.com.ar/gestion), diseñada específicamente para la administración de infraestructura urbana, seguimiento de reclamos e incidentes barriales, catastro parcelario y despacho de cuadrillas de obras públicas para el barrio **Antula**.

---

## 🚀 Tecnologías Principales

- **Frontend**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Diseño & UI**: [Tailwind CSS 3.4](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/) (paleta adaptada con diseño municipal ejecutivo)
- **Cartografía & SIG**: [MapLibre GL JS](https://maplibre.org/) con capas vectoriales interactivas GeoJSON derivadas de GeoPackage (`calles.gpkg` y `manzanas.gpkg`)
- **Backend-as-a-Service**: [@insforge/sdk](https://www.npmjs.com/package/@insforge/sdk) (PostgreSQL, PostgREST API, Auth y Realtime)
- **Control de Versiones**: [GitHub](https://github.com/odiningenieria/antula)

---

## 🗺️ Datos Territoriales Georreferenciados

La plataforma procesa y visualiza la totalidad de los datos espaciales provistos en el proyecto:

1. **`manzanas.gpkg` / `manzanas.geojson`**:
   - **132 polígonos catastrales** (códigos M-001 a M-138 y sectores baldíos).
   - Detección de parcelas, selección interactiva, cálculo de superficie y asociación directa a reclamos vecinales.

2. **`calles.gpkg` / `calles.geojson`**:
   - **70 tramos de la red vial**.
   - Tipificación de calzada:
     - **Tipo 1 - Asfalto** (29 tramos / 41.4%): Vías de rodaje asfaltadas.
     - **Tipo 2 - Ripio con cuneta** (41 tramos / 58.6%): Calzadas consolidadas con drenaje pluvial que requieren mantenimiento periódico con motoniveladora.
   - Filtros dinámicos en tiempo real por estado de pavimentación.

---

## 🌟 Módulos y Funcionalidades

### 1. 📊 Tablero Ejecutivo (Dashboard)
- Indicadores clave de rendimiento (KPIs): Reclamos activos, resueltos, urgentes y porcentaje de resolución.
- Estadísticas territoriales de infraestructura (red vial, cobertura de asfalto vs. ripio).
- Métricas operativas de cuadrillas en calle.
- Registro cronológico de reclamos recientes con accesos rápidos.

### 2. 🗺️ Visor Cartográfico SIG (MapLibre GL)
- Mapa interactivo de alta resolución centrado en Antula con controles de zoom, rotación y escala métrica.
- Capas intercambiables de mapa base:
  - **Carto Positron** (claro, estilo municipal analítico)
  - **Carto Dark Matter** (modo nocturno)
  - **Carto Voyager** (topográfico y vial)
  - **ESRI World Imagery** (satelital de alta resolución)
- Modos de interacción:
  - Selección de manzanas con detalle de atributos.
  - Selección de calles con estado de pavimentación y longitud.
  - Marcadores de reclamos clasificados por categoría y severidad.
  - **Modo "+ Reportar en Mapa"**: Permite hacer clic en cualquier punto del territorio para abrir instantáneamente la carga de un reclamo con las coordenadas y contexto geográfico pre-cargados.

### 3. 📋 Reclamos e Incidentes Ciudadanos
- Listado detallado y filtrado por estado (*Recibido, Cuadrilla Asignada, En Proceso, Finalizado, Rechazado*), categoría (*Vialidad, Alumbrado, Saneamiento/Agua, Espacios Verdes*) y prioridad.
- Búsqueda por código de reclamo, vecino o descripción.
- Visualización de fotografías de relevamiento de campo.
- Cambio de estado y asignación directa a cuadrillas de servicio.
- Botón directo para enfocar y ubicar el reclamo en el visor cartográfico.

### 4. 🚜 Obras Públicas & Cuadrillas
- Gestión de cuadrillas municipales (*Cuadrilla Vial 1, Cuadrilla Alumbrado, Cuadrilla Espacios Verdes, Cuadrilla Saneamiento*).
- Seguimiento de órdenes de trabajo (OT) activas y finalizadas.
- Vinculación de órdenes de trabajo con reclamos ciudadanos específicos.

### 5. 📐 Catastro Territorial
- Padrón catastral completo de manzanas y tramos de calles.
- Buscador rápido por código catastral o número de calle.
- Exportación de listados y salto directo al visor geográfico.

### 6. 🤖 Asistente Inteligente Municipal
- Chat de asistencia contextual que procesa consultas sobre la red vial, estado de reclamos, catastro y recomendaciones operativas.

### 7. ⚙️ Conexión InsForge BaaS & GitHub
- Interfaz gráfica para configurar la URL base de InsForge y clave anónima (`anonKey`).
- Prueba de conectividad PostgREST.
- Respaldo en `localStorage` para funcionamiento offline resiliente.
- Herramienta para restablecer los datos de muestra municipales.

---

## 🛠️ Instalación y Ejecución Local

### Prerrequisitos
- [Node.js](https://nodejs.org/) v18 o superior.
- [npm](https://www.npmjs.com/) v9 o superior.

### Pasos:

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/odiningenieria/antula.git
   cd antula
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:5173`.

4. **Compilar para producción**:
   ```bash
   npm run build
   ```
   Los archivos estáticos listos para desplegar se generarán en la carpeta `dist/`.

---

## 📂 Estructura del Proyecto

```
antula/
├── src/
│   ├── components/
│   │   ├── AsistenteView.tsx       # Chat con asistente municipal contextual
│   │   ├── CatastroView.tsx        # Consulta y padrón catastral de manzanas y calles
│   │   ├── ConfiguracionView.tsx   # Panel de conexión InsForge BaaS
│   │   ├── MapLibreView.tsx        # Visor cartográfico SIG con capas MapLibre GL
│   │   ├── NuevoReclamoModal.tsx   # Modal de creación de reclamos con georreferenciación
│   │   ├── ObrasView.tsx           # Administración de cuadrillas y órdenes de trabajo
│   │   ├── ReclamosView.tsx        # Tablero y listado de reclamos ciudadanos
│   │   ├── Sidebar.tsx             # Navegación principal
│   │   └── TableroView.tsx         # Dashboard ejecutivo con KPIs municipales
│   ├── data/
│   │   ├── calles.json             # GeoJSON de la red vial (70 tramos)
│   │   └── manzanas.json           # GeoJSON de manzanas (132 polígonos)
│   ├── lib/
│   │   └── insforge.ts             # Cliente @insforge/sdk y datos semilla
│   ├── types/
│   │   └── index.ts                # Tipos TypeScript para SIG, reclamos y cuadrillas
│   ├── App.tsx                     # Componente raíz y control de estado
│   ├── index.css                   # Tailwind CSS y personalización MapLibre
│   ├── main.tsx                    # Punto de entrada React
│   └── vite-env.d.ts               # Declaraciones de tipos para Vite
├── calles.gpkg                     # Capa original GeoPackage de calles
├── manzanas.gpkg                   # Capa original GeoPackage de manzanas
├── index.html                      # HTML principal con fuentes tipográficas
├── tailwind.config.js              # Configuración Tailwind CSS
├── tsconfig.json                   # Configuración TypeScript
└── vite.config.ts                  # Configuración Vite
```

---

## 🔒 Variables de Entorno (Opcional)

Puedes crear un archivo `.env` en la raíz del proyecto para definir valores por defecto de InsForge:

```env
VITE_INSFORGE_BASE_URL=https://tu-proyecto.region.insforge.app
VITE_INSFORGE_ANON_KEY=tu-clave-anon-insforge
```

Si no se especifican, la plataforma cuenta con valores seguros predeterminados y persistencia en navegador para que funcione inmediatamente en modo demostración y producción.
