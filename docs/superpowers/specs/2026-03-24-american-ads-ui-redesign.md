# UI Redesign — American ADS Gradient Tech
**Fecha:** 2026-03-24
**Proyecto:** Dashboard Innovación & Creatividad
**Estado:** Aprobado por usuario

---

## Resumen

Rediseño visual completo del dashboard para alinear la identidad de marca con American ADS (https://american-ads.com/), combinando su paleta oficial con una estética futurista "Gradient Tech". El rediseño es puramente visual — no cambia funcionalidad, rutas, lógica de negocio ni estructura de datos.

---

## Decisiones de Diseño Aprobadas

### 1. Dirección visual: Gradient Tech
- Fondos oscuros (`#090910` base, `#0c0c14` superficies)
- Gradientes `linear-gradient(135deg, rgba(255,106,185,0.12..0.15), rgba(9,9,16,0.95))` en cards, header y tabla
- Borde inferior decorativo `linear-gradient(90deg, #FF6AB9, transparent)` en KPI cards
- Orbe decorativo (div absoluto, círculo semitransparente) en esquina superior derecha de cada KPI card
- Header con `backdropFilter: 'blur(12px)'` y gradiente diagonal sutil

### 2. Paleta de colores
Todos los tokens siguientes deben declararse en `:root` en `index.css`. Los marcados con ★ reemplazan un valor existente; los demás son nuevos.

| Token | Valor | Uso |
|---|---|---|
| `--bg-base` ★ | `#090910` | Fondo página (era `#080C10`) |
| `--bg-surface` ★ | `#0c0c14` | Superficies / cards (era `#0D1117`) |
| `--bg-surface-2` | `#111920` | Sin cambio — mantener |
| `--accent` ★ | `#FF6AB9` | Color primario de marca (era `#00D4FF`) |
| `--accent-dim` ★ | `rgba(255,106,185,0.08)` | Hover de filas, fondos sutiles (era cyan) |
| `--accent-gradient` (nuevo) | `linear-gradient(135deg, #FF6AB9, #e040a0)` | Botones primarios, barras de gráfico activas |
| `--border` ★ | `rgba(255,106,185,0.15)` | Bordes estándar (era cyan) |
| `--border-subtle` | `rgba(255,255,255,0.04)` | Sin cambio |
| `--border-accent` (nuevo) | `rgba(255,106,185,0.30)` | Bordes de énfasis (botones, inputs en foco) |
| `--text-primary` | `#E2E8F0` | Sin cambio |
| `--text-muted` ★ | `#6b7280` | Labels, ejes, subtítulos (era `#4A6080`) |
| `--text-secondary` (nuevo) | `#9ca3af` | Texto terciario (hbar labels, ejes gráficos) |
| `--positive` ★ | `#34d399` | MG% alto ≥35% (era `#00FF88`) |
| `--warning` (nuevo) | `#f59e0b` | MG% medio 20–35% |
| `--negative` | `#FF4D6D` | Sin cambio |
| `--sans` ★ | `'Archivo', system-ui, sans-serif` | Fuente body (era Inter) |
| `--display` (nuevo) | `'Anton', sans-serif` | Fuente display / números de impacto |
| `--mono` ★ | `'Archivo', system-ui, sans-serif` | Reemplazar todas las referencias a `--mono` con `--sans` o `--display` según aplique |

> **Nota:** `--mono` se elimina conceptualmente. Todos los usos actuales de `var(--mono)` deben ser reemplazados por `var(--sans)` (texto) o `var(--display)` (números grandes, títulos) según el contexto.

### 3. Tipografía — tabla de referencia

| Elemento | Fuente | Tamaño | Peso | Color |
|---|---|---|---|---|
| Header título | Anton | 19px | 400 | `#FF6AB9` |
| Header subtítulo | Archivo | 13px | 300 | `var(--text-muted)` |
| KPI label | Archivo | 11px | 600 | `var(--text-muted)` |
| KPI valor | Anton | 30px | 400 | blanco o magenta |
| KPI sub | Archivo | 12px | 300 | `#FF6AB9` |
| Chart title | Archivo | 11px | 600 | `var(--text-muted)` uppercase |
| Eje gráficos | Archivo | 10px | 400 | `var(--text-muted)` |
| Hbar labels | Archivo | 11px | 400 | `var(--text-secondary)` |
| Filter label | Archivo | 11px | 600 | `var(--text-muted)` |
| Filter inputs/selects | Archivo | 13px | 400 | `var(--text-secondary)` |
| Btn Nuevo | Archivo | 13px | 600 | `#fff` |
| TH tabla | Archivo | 11px | 600 | `var(--text-muted)` uppercase |
| TD texto general | Archivo | 14px | 400 | `#d1d5db` |
| TD campaña | Archivo | 14px | 600 | `#FF6AB9` |
| TD números (prod/tarifa/margen) | Anton | 15px | 400 | `#e2e8f0` |
| TD MG% | Anton | 15px | 400 | verde/amber/rojo |
| Badge estado | Archivo | 12px | 600 | según estado |
| Btn editar/eliminar | Archivo | 12px | 600 | magenta / rojo |
| Login título | Anton | 21px | 400 | `#FF6AB9` uppercase |
| Login subtítulo | Archivo | 12px | 300 | `var(--text-muted)` uppercase |
| Login labels | Archivo | 11px | 600 | `var(--text-muted)` |
| Login inputs | Archivo | 14px | 400 | `var(--text-primary)` |
| Login PIN input | Archivo | 22px | 400 | `var(--text-primary)` |
| Login btn | Archivo | 13px | 700 | `#fff` |
| Modal labels | Archivo | 11px | 600 | `var(--text-muted)` |
| Modal inputs | Archivo | 13px | 400 | `var(--text-primary)` |
| Usuarios TH | Archivo | 11px | 600 | `var(--text-muted)` uppercase |
| Usuarios TD | Archivo | 14px | 400 | `#d1d5db` |

---

## Archivos a Modificar

### `frontend/index.css`
1. Reemplazar el bloque de imports:
   ```css
   @import url('https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@300;400;600;700&display=swap');
   ```
   Eliminar cualquier `@import` de Google Fonts existente (Inter, JetBrains Mono).

2. En `:root`, actualizar/agregar los tokens de la tabla de la sección 2.

3. Actualizar el scrollbar thumb: `rgba(255,106,185,0.2)` hover `rgba(255,106,185,0.4)`.

4. Actualizar el `background-image` del select (SVG de flecha): cambiar el color del SVG de `--text-muted` usando el nuevo valor `#6b7280`.

> **App.css**: No requiere cambios funcionales. Contiene clases de plantilla Vite (`.hero`, `.counter`, etc.) que no están en uso en producción.

> **`index.html`**: No contiene imports de fuentes — las fuentes se cargan solo desde `index.css`. No requiere cambios.

---

### `frontend/src/components/KPICard.jsx`
- Reemplazar `background: 'var(--bg-surface)'` por `background: 'linear-gradient(135deg, rgba(255,106,185,0.13) 0%, rgba(9,9,16,0.95) 100%)'`
- Reemplazar `border: '1px solid var(--border)'` → conservar usando el token actualizado (el token ya tendrá el nuevo valor)
- Reemplazar `boxShadow` hover: `'0 0 24px rgba(255,106,185,0.12), 0 1px 3px rgba(0,0,0,0.4)'`
- Reemplazar `borderColor` hover: `'rgba(255,106,185,0.35)'`
- Reemplazar `borderColor` onMouseLeave: `'var(--border)'` (sin cambio en la llamada, el token se actualiza)
- **Eliminar** la línea superior cyan (`div` con `h-px`) y reemplazarla por:
  - Orbe decorativo: `<div style={{ position:'absolute', top:'-20px', right:'-20px', width:65, height:65, background:'rgba(255,106,185,0.12)', borderRadius:'50%', pointerEvents:'none' }} />`
  - Línea inferior: `<div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:'linear-gradient(90deg, #FF6AB9, transparent)', borderRadius:'0 0 12px 12px' }} />`
- Título `<p>`: cambiar `fontFamily: 'var(--mono)'` → `fontFamily: 'var(--sans)'`, mantener `fontSize` (se ajustará a 11px vía CSS), agregar `fontWeight: 600`
- Valor `<p>`: cambiar `fontFamily: 'var(--mono)'` → `fontFamily: 'var(--display)'`, `fontSize: '30px'`, quitar `font-bold` de className
- Subtítulo `<p>`: `fontFamily: 'var(--sans)'`, `fontSize: '12px'`, `fontWeight: 300`, `color: '#FF6AB9'`
- Quitar clases Tailwind de tamaño tipográfico que puedan sobreescribir (`text-3xl`, `text-xs`, `font-bold`)

---

### `frontend/src/App.jsx`
**Header:**
- `background`: `'linear-gradient(135deg, rgba(255,106,185,0.1) 0%, rgba(9,9,16,0.97) 60%)'`
- `borderBottom`: `'1px solid rgba(255,106,185,0.2)'`
- Agregar `backdropFilter: 'blur(12px)'`
- Título: `fontFamily: 'var(--display)'`, `fontSize: '19px'`, `color: 'var(--accent)'`, `letterSpacing: '0.1em'`, `textTransform: 'uppercase'`
- Subtítulo greeting: `fontFamily: 'var(--sans)'`, `fontSize: '13px'`, `fontWeight: 300`

**Vista select:**
- `background`: `'linear-gradient(135deg, rgba(255,106,185,0.12), rgba(9,9,16,0.95))'`
- `border`: `'1px solid rgba(255,106,185,0.35)'`
- `color`: `'#FF6AB9'`, `fontFamily: 'var(--sans)'`, `fontSize: '13px'`, `fontWeight: 600`
- `onBlur` restaurar: `borderColor: 'rgba(255,106,185,0.35)'` (reemplaza el cyan hardcodeado)

**Botones header (Excel, PDF, Salir):**
- `border`: `'1px solid rgba(255,106,185,0.3)'`
- `color`: `'#9ca3af'`, `fontFamily: 'var(--sans)'`, `fontSize: '13px'`
- `onMouseLeave` restaurar borde: `'rgba(255,106,185,0.3)'` (reemplaza cyan hardcodeado)

**Botón Usuarios:**
- `background`: `'rgba(255,106,185,0.08)'`
- `border`: `'1px solid rgba(255,106,185,0.2)'`
- `color`: `'#FF6AB9'`, `fontFamily: 'var(--sans)'`, `fontSize: '13px'`, `fontWeight: 600`

**Botón + Nuevo:**
- `background`: `'linear-gradient(135deg, #FF6AB9, #e040a0)'`
- `border`: `'none'`, `color`: `'#fff'`, `fontFamily: 'var(--sans)'`, `fontSize: '13px'`, `fontWeight: 600`
- Hover: reducir opacidad `0.9` o `filter: brightness(1.05)`

**Filtros (selects, inputs):**
- `background`: `'rgba(255,106,185,0.05)'`
- `border`: `'1px solid rgba(255,106,185,0.15)'`
- `color`: `'var(--text-secondary)'`, `fontFamily: 'var(--sans)'`, `fontSize: '13px'`
- Focus `border`: `'1px solid var(--accent)'`
- `onBlur` restaurar: `'rgba(255,106,185,0.15)'`

**Filter label FILTROS:**
- `fontFamily: 'var(--sans)'`, `fontSize: '11px'`, `fontWeight: 600`, `color: 'var(--text-muted)'`

---

### `frontend/src/components/Charts.jsx`
- `CYAN_SHADES` array → reemplazar por degradado de magentas:
  ```js
  const PINK_SHADES = [
    '#FF6AB9','#F05EAA','#E0529B','#D0468C','#C03A7D',
    '#B02E6E','#A0225F','#901650','#800A41','#700032',
  ];
  ```
- Todos los usos de `CYAN_SHADES` → `PINK_SHADES`
- `CustomTooltip`:
  - `background`: `'var(--bg-surface)'`
  - `border`: `'1px solid rgba(255,106,185,0.2)'`
  - `fontFamily`: `'var(--sans)'`
  - Color del label: `'var(--accent)'` (sin cambio en la llamada, token actualizado)
  - `entry.name === 'Margen'` → `color: 'var(--positive)'` (sin cambio, token actualizado)
- Tick `style` en `XAxis`/`YAxis`: `fontFamily: 'var(--sans)'`, `fontSize: 10`, `fill: 'var(--text-muted)'`
- Ejes `<Bar fill>`: `fill='var(--accent)'` o `fill={PINK_SHADES[i]}`

---

### `frontend/src/components/ComparativoChart.jsx`
- Barras año anterior (`Bar`): `fill='rgba(255,106,185,0.3)'` (era slate gris)
- Barras año actual (`Bar`): `fill='#FF6AB9'`
- Tooltip: mismas reglas que `Charts.jsx`
- Tick fontSize: 10, fontFamily: `'var(--sans)'`, fill: `'var(--text-muted)'`
- Legend: `fontFamily: 'var(--sans)'`, `fontSize: 11`
- Title section: `fontFamily: 'var(--sans)'`, `fontSize: '11px'`, uppercase, muted

---

### `frontend/src/components/ProjectsTable.jsx`
**Container:**
- `background`: `'linear-gradient(135deg, rgba(255,106,185,0.04) 0%, rgba(9,9,16,0.98) 100%)'`
- `border`: `'1px solid rgba(255,106,185,0.15)'`, `borderRadius: '12px'`

**`<thead>`:**
- `background`: `'linear-gradient(90deg, rgba(255,106,185,0.1), transparent)'`
- `borderBottom`: `'1px solid rgba(255,106,185,0.15)'`

**`<th>`:**
- `fontFamily: 'var(--sans)'`, `fontSize: '11px'`, `fontWeight: 600`
- `color: 'var(--text-muted)'`, `textTransform: 'uppercase'`, `letterSpacing: '0.1em'`
- `padding: '13px 16px'`

**`<tbody tr>` hover:**
- `background: 'rgba(255,106,185,0.05)'` (era `var(--accent-dim)`)

**`<tbody tr>` border:**
- `borderBottom: '1px solid rgba(255,106,185,0.06)'`

**`<td>` general:**
- `fontFamily: 'var(--sans)'`, `fontSize: '14px'`, `color: '#d1d5db'`, `padding: '12px 16px'`

**`<td>` campaña:**
- `color: '#FF6AB9'`, `fontWeight: 600`, `fontSize: '14px'`

**`<td>` números (producción, tarifa, margen absoluto):**
- `fontFamily: 'var(--display)'`, `fontSize: '15px'`, `color: '#e2e8f0'`

**`<td>` MG%:**
- `fontFamily: 'var(--display)'`, `fontSize: '15px'`
- ≥35%: `color: 'var(--positive)'` → `#34d399`
- 20–35%: `color: 'var(--warning)'` → `#f59e0b`
- <20%: `color: 'var(--negative)'`

**Badge `Presupuestado`:**
- `background: 'rgba(255,255,255,0.04)'`, `border: '1px solid rgba(255,255,255,0.12)'`
- `color: 'var(--text-muted)'`, `fontFamily: 'var(--sans)'`, `fontSize: '12px'`, `fontWeight: 600`
- `padding: '4px 10px'`, `borderRadius: '6px'`

**Badge `Realizado`:**
- `background: 'linear-gradient(135deg, rgba(255,106,185,0.15), rgba(255,106,185,0.05))'`
- `border: '1px solid rgba(255,106,185,0.4)'`
- `color: '#FF6AB9'`, `fontFamily: 'var(--sans)'`, `fontSize: '12px'`, `fontWeight: 600`
- `padding: '4px 10px'`, `borderRadius: '6px'`

**Botón Editar:**
- `border: '1px solid rgba(255,106,185,0.25)'`, `color: '#FF6AB9'`
- `fontFamily: 'var(--sans)'`, `fontSize: '12px'`, `fontWeight: 600`
- `padding: '4px 10px'`, `borderRadius: '6px'`

**Botón Eliminar:**
- `border: '1px solid rgba(255,77,109,0.2)'`, `color: '#ff4d6d'`
- `fontFamily: 'var(--sans)'`, `fontSize: '12px'`, `fontWeight: 600`
- `padding: '4px 10px'`, `borderRadius: '6px'`

**Paginación (← →):**
- `border`: `'1px solid rgba(255,106,185,0.2)'`, hover `'rgba(255,106,185,0.4)'`
- `color: 'var(--text-muted)'`

---

### `frontend/src/components/ProjectModal.jsx`
- Backdrop: `rgba(0,0,0,0.75)` con `backdropFilter: 'blur(4px)'` — sin cambio
- Dialog glow: `boxShadow: '0 0 60px rgba(255,106,185,0.12)'`
- Dialog border: `'1px solid rgba(255,106,185,0.2)'`
- Header del modal border bottom: `'1px solid rgba(255,106,185,0.15)'`
- Labels: `fontFamily: 'var(--sans)'`, `fontSize: '11px'`, `fontWeight: 600`, uppercase, muted
- Inputs/textareas:
  - `background: 'var(--bg-base)'`, `border: '1px solid rgba(255,106,185,0.2)'`
  - `fontFamily: 'var(--sans)'`, `fontSize: '13px'`
  - Focus border: `'1px solid var(--accent)'` (token actualizado, sin cambio en la llamada)
  - `onBlur` restaurar: `'rgba(255,106,185,0.2)'` (reemplaza el cyan hardcodeado)
- Botón Guardar activo:
  - `background: 'linear-gradient(135deg, #FF6AB9, #e040a0)'`, `color: '#fff'`
  - `fontFamily: 'var(--sans)'`, `fontSize: '13px'`, `fontWeight: 700`
- Botón Cancelar: outline `rgba(255,106,185,0.2)`, color muted
- Preview calculado (prod/margen/mg%): `fontFamily: 'var(--display)'` para los números

---

### `frontend/src/pages/Login.jsx`
- Card container:
  - `background: 'linear-gradient(135deg, rgba(255,106,185,0.08) 0%, rgba(9,9,16,1) 60%)'`
  - `border: '1px solid rgba(255,106,185,0.2)'`, `borderRadius: '14px'`
  - Agregar orbe decorativo: `<div style={{ position:'absolute', top:'-60px', right:'-60px', width:150, height:150, background:'rgba(255,106,185,0.08)', borderRadius:'50%', pointerEvents:'none' }} />`
- Título: `fontFamily: 'var(--display)'`, `fontSize: '21px'`, `color: 'var(--accent)'`, uppercase, centered
- Subtítulo: `fontFamily: 'var(--sans)'`, `fontSize: '12px'`, `fontWeight: 300`, muted, uppercase, centered
- Labels: `fontFamily: 'var(--sans)'`, `fontSize: '11px'`, `fontWeight: 600`, muted, uppercase
- Inputs: `fontFamily: 'var(--sans)'`, `fontSize: '14px'`, borde magenta 20%
- PIN input: `fontSize: '22px'`, `letterSpacing: '0.4em'`
- Focus input border: `var(--accent)`; `onBlur` restaurar: `'rgba(255,106,185,0.2)'`
- Botón Ingresar:
  - `background: 'linear-gradient(135deg, #FF6AB9, #e040a0)'`
  - `fontFamily: 'var(--sans)'`, `fontSize: '13px'`, `fontWeight: 700`
  - `letterSpacing: '0.08em'`, `textTransform: 'uppercase'`, `color: '#fff'`
- Estado loading del botón: `background: 'rgba(255,106,185,0.1)'`, `color: 'var(--accent)'`
- Error message: `color: '#ff4d6d'`, `background: 'rgba(255,77,109,0.08)'`, `border: '1px solid rgba(255,77,109,0.2)'`

---

### `frontend/src/pages/UsersPage.jsx`
- Mismas reglas de tabla que `ProjectsTable.jsx`
- **Role badges:**
  - DEV: `border: '1px solid var(--accent)'`, `color: 'var(--accent)'`, `fontFamily: 'var(--sans)'`, `fontSize: '11px'`
  - Admin: `border: '1px solid rgba(255,106,185,0.3)'`, `color: 'rgba(255,106,185,0.7)'`
  - Lector: `border: '1px solid rgba(255,255,255,0.1)'`, `color: 'var(--text-muted)'`
- Botones Editar/Eliminar: mismas reglas que `ProjectsTable.jsx`
- Self-delete disabled: `opacity: 0.4`, `cursor: 'not-allowed'`

---

### `frontend/src/components/UserModal.jsx`
- Mismas reglas que `ProjectModal.jsx`

---

### `frontend/src/components/ExportButtons.jsx`
- Botones Excel/PDF:
  - `border: '1px solid rgba(255,106,185,0.3)'`, `color: '#9ca3af'`
  - `fontFamily: 'var(--sans)'`, `fontSize: '13px'`
  - Hover border: `'rgba(255,106,185,0.6)'`, color: `'var(--accent)'`

---

## Archivos NO modificados

- Todo el backend (`routes/`, `middleware/`, `db.js`, `server.js`, `services/`)
- `frontend/src/utils/api.js`
- `frontend/src/utils/format.js`
- `frontend/src/hooks/useData.js`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/router.jsx`, `frontend/src/main.jsx`
- Archivos de configuración (`.env`, `vite.config.js`, `package.json`, etc.)

---

## Criterios de aceptación

1. Ningún valor `#00D4FF` (cyan) permanece en el codebase frontend
2. Ningún uso de `JetBrains Mono` ni `Inter` en producción
3. Anton y Archivo cargados correctamente desde Google Fonts en `index.css`
4. KPI cards: gradiente diagonal + orbe + línea inferior magenta + hover con sombra magenta
5. Header: gradiente diagonal + backdrop-blur + título Anton 19px magenta
6. Tabla: thead con gradiente horizontal, hover row magenta sutil
7. Badge `Realizado` en magenta, `Presupuestado` en gris sutil
8. Login: orbe decorativo + gradiente de card + botón en degradado magenta
9. Todos los tamaños tipográficos respetan la tabla de referencia (mínimo 11px visible)
10. Gráficos recharts con barras en magenta / shades de magenta
11. Todos los `onBlur`/`onMouseLeave` que restauraban colores cyan ahora restauran magenta equivalente
12. `var(--mono)` no queda en uso — reemplazado por `var(--sans)` o `var(--display)` según contexto
