// frontend/src/utils/permissions.js
// V3 — Lógica de permisos por área

export const AREAS = ['Creatividad', 'Producción', 'Trade', 'Finanzas', 'Comercial'];

/** Áreas que el usuario puede ver */
export function getAreasPermitidas(user) {
  if (!user) return [];
  if (user.rol === 'DEV') return [...AREAS];
  const ap = user.areas_permitidas;
  if (!ap) return [];
  return Array.isArray(ap) ? ap : [];
}

/** ¿El usuario puede ver una área específica? */
export function canViewArea(user, area) {
  if (!user) return false;
  if (user.rol === 'DEV') return true;
  return getAreasPermitidas(user).includes(area);
}

/** ¿El usuario puede crear/editar proyectos en esa área? */
export function canEditInArea(user, area) {
  if (!user) return false;
  if (user.rol === 'DEV') return true;
  if (user.rol === 'Lector') return false;
  // Admin: solo en su área principal
  return user.area_principal === area;
}

/** ¿El usuario puede crear proyectos en general? */
export function canCreateAny(user) {
  if (!user) return false;
  if (user.rol === 'DEV') return true;
  if (user.rol === 'Admin') return !!user.area_principal;
  return false;
}

/** ¿Es usuario de Finanzas? */
export function isFinanzas(user) {
  return user?.area_principal === 'Finanzas';
}

/** ¿Puede ver los campos de gasto de estructura? */
export function canSeeGastoEstructura(user) {
  if (!user) return false;
  if (user.rol === 'DEV') return true;
  return user.area_principal === 'Finanzas';
}

/**
 * Área activa por defecto según perfil del usuario.
 * null = vista consolidada (todas las áreas)
 */
export function getDefaultArea(user) {
  if (!user) return null;
  if (user.rol === 'DEV') return null;          // DEV ve todo por defecto
  if (isFinanzas(user)) return null;            // Finanzas ve consolidado
  if (user.area_principal) return user.area_principal;
  return null;
}

/** ¿El usuario tiene acceso a múltiples áreas (mostrar switcher)? */
export function hasMultipleAreas(user) {
  return getAreasPermitidas(user).length > 1;
}
