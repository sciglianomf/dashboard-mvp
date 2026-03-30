// supabase/functions/admin-users/index.ts
// Admin-only edge function for user management.
// Verifica que el caller sea DEV usando el admin client con service role.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Admin client — único client necesario
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // --- 1. Extraer y validar JWT del caller ---
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return json({ error: 'No authorization header' }, 401);
    }

    // getUser(token) valida el JWT contra Supabase Auth
    const { data: { user }, error: userError } = await admin.auth.getUser(token);
    if (userError || !user) {
      return json({ error: `Invalid token: ${userError?.message ?? 'unknown'}` }, 401);
    }

    // --- 2. Verificar que el caller sea DEV ---
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return json({ error: `Profile lookup failed: ${profileError.message}` }, 500);
    }

    if (profile?.rol !== 'DEV') {
      return json({ error: 'Forbidden: se requiere rol DEV' }, 403);
    }

    // --- 3. Leer body ---
    const body = await req.json();
    const { action, payload } = body;

    // --- CREATE USER ---
    if (action === 'createUser') {
      const { email, password, nombre, rol, area_principal, areas_permitidas } = payload;

      if (!email || !password || !nombre || !rol) {
        return json({ error: 'Faltan campos requeridos: email, password, nombre, rol' }, 400);
      }

      const { data: authData, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createError) {
        return json({ error: createError.message }, 400);
      }

      const { error: profileInsertError } = await admin.from('profiles').upsert({
        id: authData.user.id,
        email,
        nombre,
        rol,
        area_principal: area_principal || null,
        areas_permitidas: areas_permitidas || [],
      });

      if (profileInsertError) {
        await admin.auth.admin.deleteUser(authData.user.id);
        return json({ error: 'Error al crear perfil: ' + profileInsertError.message }, 500);
      }

      return json({
        user: {
          id: authData.user.id,
          email,
          nombre,
          rol,
          area_principal: area_principal || null,
          areas_permitidas: areas_permitidas || [],
        },
      });
    }

    // --- DELETE USER ---
    if (action === 'deleteUser') {
      const { userId } = payload;
      if (!userId) return json({ error: 'userId requerido' }, 400);

      await admin.from('profiles').delete().eq('id', userId);

      const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
      if (deleteError) return json({ error: deleteError.message }, 500);

      return json({ ok: true });
    }

    // --- UPDATE PASSWORD ---
    if (action === 'updatePassword') {
      const { userId, password } = payload;
      if (!userId || !password) return json({ error: 'userId y password requeridos' }, 400);
      if (password.length < 4) return json({ error: 'Mínimo 4 caracteres' }, 400);

      const { error: pwError } = await admin.auth.admin.updateUserById(userId, { password });
      if (pwError) return json({ error: pwError.message }, 500);

      return json({ ok: true });
    }

    return json({ error: `Acción desconocida: ${action}` }, 400);

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: msg }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
