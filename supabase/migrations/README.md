# Migraciones SQL — Supabase

Ejecutar en orden en el SQL Editor de Supabase (supabase.com → tu proyecto → SQL Editor).

| Archivo | Qué hace | Cuándo ejecutar |
|---------|----------|-----------------|
| `001_users_profiles.sql` | Tabla `profiles`, triggers de auth | Fase 1 |
| `002_projects.sql` | Tabla `projects` con todos los campos | Fase 2 |
| `003_rls_policies.sql` | Row Level Security por rol | Después de 001 y 002 |

## Convención de nombres

```
NNN_descripcion.sql
```

- `NNN` = número secuencial con ceros a la izquierda (001, 002, ...)
- Nunca modificar una migración ya ejecutada en producción
- Cambios posteriores = nueva migración numerada
