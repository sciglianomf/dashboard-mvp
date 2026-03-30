// supabase/functions/admin-users/index.ts
// Admin-only edge function for user management operations.
// Requires the caller to be a DEV user — verified via JWT + profiles table.
// Uses SUPABASE_SERVICE_ROLE_KEY (auto-injected by Supabase) for admin operations.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // --- 1. Verify caller via their JWT ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'No authorization header' }, 401);
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user) {
      return json({ error: 'Invalid session' }, 401);
    }

    const { data: profile } = await callerClient
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (profile?.rol !== 'DEV') {
      return json({ error: 'Forbidden: DEV role required' }, 403);
    }

    // --- 2. Admin client with service role ---
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const { action, payload } = body;

    // --- CREATE USER ---
    if (action === 'createUser') {
      const { email, password, nombre, rol, area_principal, areas_permitidas } = payload;

      if (!email || !password || !nombre || !rol) {
        return json({ error: 'Faltan campos requeridos' }, 400);
      }

      const { data: authData, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createError) {
        return json({ error: createError.message }, 400);
      }

      const { error: profileError } = await admin.from('profiles').upsert({
        id: authData.user.id,
        email,
        nombre,
        rol,
        area_principal: area_principal || null,
        areas_permitidas: areas_permitidas || [],
      });

      if (profileError) {
        // Rollback: delete the auth user we just created
        await admin.auth.admin.deleteUser(authData.user.id);
        return json({ error: 'Error al crear perfil: ' + profileError.message }, 500);
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

      // Delete profile first (FK constraint)
      await admin.from('profiles').delete().eq('id', userId);

      const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
      if (deleteError) {
        return json({ error: deleteError.message }, 500);
      }

      return json({ ok: true });
    }

    // --- UPDATE PASSWORD ---
    if (action === 'updatePassword') {
      const { userId, password } = payload;
      if (!userId || !password) return json({ error: 'userId y password requeridos' }, 400);
      if (password.length < 4) return json({ error: 'La contraseña debe tener al menos 4 caracteres' }, 400);

      const { error: pwError } = await admin.auth.admin.updateUserById(userId, { password });
      if (pwError) return json({ error: pwError.message }, 500);

      return json({ ok: true });
    }

    return json({ error: 'Acción desconocida' }, 400);

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    return json({ error: msg }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
