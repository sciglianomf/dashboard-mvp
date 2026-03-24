# Spec: Dark Obsidian UI + Edición V1
**Fecha:** 2026-03-23
**Proyecto:** Dashboard Innovación & Creatividad
**Estado:** Aprobado por usuario

---

## Objetivo

Rediseñar la UI del dashboard con estética Dark Obsidian (minimalista, tech, futurista) e incorporar edición de proyectos en V1.

---

## 1. Sistema de Diseño — Dark Obsidian

### Paleta
| Token | Valor |
|---|---|
| `bg-base` | `#080C10` |
| `bg-surface` | `#0D1117` |
| `bg-surface-2` | `#111920` |
| `border` | `rgba(0,212,255,0.15)` |
| `accent` | `#00D4FF` |
| `text-primary` | `#E2E8F0` |
| `text-muted` | `#4A6080` |
| `positive` | `#00FF88` |
| `negative` | `#FF4D6D` |

### Tipografía
- KPI numbers: `JetBrains Mono` (via Google Fonts)
- UI general: `Inter`

### Efectos
- Cards hover: `box-shadow 0 0 20px rgba(0,212,255,0.08)`
- Bordes activos/focus: `1px solid #00D4FF`
- Header: línea inferior `1px solid rgba(0,212,255,0.3)`

---

## 2. Componentes Afectados

### Header
- Fondo `bg-base`, borde inferior cyan tenue
- Título en `accent`, subtítulo en `text-muted`
- Botones Export: ghost con borde cyan, hover relleno cyan

### KPI Cards (4)
- Fondo `bg-surface`, borde `border`
- Micro-línea cyan arriba (`3px`)
- Número en `JetBrains Mono` bold grande
- Label en Inter uppercase 11px `text-muted`
- Hover glow suave

### Charts (Recharts)
- Fondo `bg-surface`
- Barras: gradiente `#00D4FF → #0066FF`
- Segunda barra (margen): `#00FF88`
- Grid: `rgba(255,255,255,0.04)`
- Tooltip: fondo `bg-surface-2`, borde `border`

### Tabla
- Fondo `bg-surface`
- Header columnas: `bg-base`, texto `text-muted` uppercase mono 11px
- Filas: separador `rgba(255,255,255,0.04)`
- Hover: `rgba(0,212,255,0.04)`
- Margen $: texto `positive`
- Badge margen %: outline de color (sin relleno)
- Paginación: ghost buttons con borde `border`
- **La página se resetea a 1 cuando cambian los filtros** (usar useEffect en ProjectsTable)

### Filtros
- Selects/inputs: `bg-surface`, borde `bg-surface-2`, texto `text-primary`
- Focus: borde `accent`
- Labels: mono uppercase
- Las opciones de año se derivan dinámicamente de los datos (no hardcodeadas)

---

## 3. Funcionalidad de Edición (V1)

### ID de proyectos

**Proyectos desde Excel:** Al parsear, se genera un `id` estable usando:
```
id = sha256(sheet + "|" + (cliente||'') + "|" + (campaña||'') + "|" + (elemento||''))
```
Se implementa con el módulo nativo `crypto` de Node.js (sin dependencias extra). Si hay colisión (dos filas idénticas en esos campos), se agrega el índice al final: `hash + "_" + i`.

**Proyectos locales nuevos:** Se genera un UUID v4 usando `crypto.randomUUID()` en el backend al hacer POST.

### Almacenamiento
Los datos nuevos/editados se guardan en `data/projects-local.json`. Al servir datos, el backend fusiona:
`Excel (base) + projects-local.json (overrides/nuevos)`

**Lógica de merge en `getProjects()`:**
1. Parsear Excel → array de proyectos con `id`
2. Leer `projects-local.json` (si existe)
3. Para cada entrada local:
   - Si `deleted: true` → excluir del resultado (tanto de la lista como de KPIs)
   - Si el `id` existe en el array Excel → reemplazar esa entrada
   - Si el `id` no existe en Excel → es un proyecto nuevo, agregar al array
4. Para proyectos locales, **recalcular** `totalProd`, `margenAbs`, `margenPct` antes de insertarlos:
   - `totalProd = costoInn + costoPlacaPai + costoLona + ws + confiPct`
   - `margenAbs = tarifa - totalProd`
   - `margenPct = tarifa > 0 ? margenAbs / tarifa : 0`
5. Devolver array final limpio (sin `deleted`)

Esta lógica aplica igual para `/api/projects` y `/api/summary`.

### Semántica de "Confi %"
A pesar del nombre, `confiPct` es un **monto en ARS** (no un porcentaje). Se trata como los demás campos de costo. En el modal se muestra como "Confi $" con input numérico en ARS.

### Operaciones soportadas en V1
- **Agregar proyecto** — botón `+ Nuevo` en header de tabla → modal vacío
- **Editar proyecto** — ícono lápiz por fila → modal prellenado
- **Eliminar proyecto** — ícono papelera con `window.confirm` → `deleted: true` en local.json

### Modal de edición
Campos editables:
| Campo | Tipo | Requerido |
|---|---|---|
| Cliente | texto | sí |
| Campaña | texto | no |
| Elemento | texto | no |
| Formato | texto | no |
| Costo Inn. | número ARS | no |
| Costo Placa PAI | número ARS | no |
| Costo Lona | número ARS | no |
| WS | número ARS | no |
| Confi $ | número ARS | no |
| Tarifa | número ARS | sí |
| Observaciones | texto largo | no |
| Situación | texto | no |

Campos calculados (preview en tiempo real, no editables):
- Total Producción = suma de los 5 costos
- Margen ARS = Tarifa − Total Producción
- Margen % = Margen ARS / Tarifa

Validación: si `Cliente` o `Tarifa` están vacíos, el botón Guardar está deshabilitado y se muestra error inline.

### Roles UI (sin auth real en V1)
| Rol | Puede ver | Puede editar/agregar | Puede eliminar |
|---|---|---|---|
| GERENTE | todo | no | no |
| JEFE | todo | sí | no |
| DEV | todo | sí | sí |

- **Rol por defecto:** `JEFE`
- **Persistencia:** guardado en `localStorage` con key `dashboard_role`
- Selector de rol en el header (dropdown), visible siempre

---

## 4. Nuevos endpoints backend
- `POST /api/projects` — crear proyecto (genera UUID, guarda en local.json)
- `PUT /api/projects/:id` — editar proyecto (actualiza entrada en local.json)
- `DELETE /api/projects/:id` — soft delete (`deleted: true` en local.json)

---

## 5. Fuera de Scope (V2)
- Login/auth real
- Escritura de vuelta al Excel original
- Historial de cambios / audit log
- Vista detalle por campaña
