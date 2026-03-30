// supabase/functions/telegram-bot/index.ts
// V4 — American ADS Bot para Telegram
//
// Comandos disponibles:
//   /start                     — Bienvenida
//   /login email contraseña    — Autenticarse con credenciales del dashboard
//   /logout                    — Cerrar sesión
//   /ayuda                     — Lista de comandos
//   /metricas [área]           — KPIs consolidados (o por área)
//   /op NUMERO                 — Buscar proyectos por número de OP
//   /cliente NOMBRE            — Buscar proyectos por cliente
//   /campanas                  — Top campañas
//   /areas                     — Áreas disponibles para el usuario

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

interface TelegramMessage {
  message_id: number;
  from?: { id: number; first_name: string; username?: string };
  chat: { id: number; type: string };
  text?: string;
}

interface Session {
  chat_id: number;
  user_id: string;
  nombre: string;
  rol: string;
  area_principal: string | null;
  areas_permitidas: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmt(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? '−' : '';
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
  return `${sign}$${Math.round(abs).toLocaleString('es-AR')}`;
}

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function fmtFecha(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getAreaFilter(session: Session): string[] | null {
  const { rol, area_principal, areas_permitidas } = session;
  if (rol === 'DEV') return null; // sin restricción
  if (area_principal === 'Finanzas') return null; // Finanzas ve todo
  return areas_permitidas?.length > 0 ? areas_permitidas : [];
}

function canSeeFinanzas(session: Session): boolean {
  return session.rol === 'DEV' || session.area_principal === 'Finanzas';
}

async function sendMessage(token: string, chatId: number, text: string): Promise<void> {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
}

// ─── Sesiones ─────────────────────────────────────────────────────────────────

async function getSession(admin: ReturnType<typeof createClient>, chatId: number): Promise<Session | null> {
  const { data, error } = await admin
    .from('telegram_sessions')
    .select('*')
    .eq('chat_id', chatId)
    .single();

  if (error || !data) return null;

  // Actualizar last_used_at silenciosamente
  admin.from('telegram_sessions').update({ last_used_at: new Date().toISOString() }).eq('chat_id', chatId);

  return data as Session;
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

function handleStart(): string {
  return `🤖 <b>American ADS Bot</b>

Hola! Soy el asistente del dashboard de American ADS.

Para empezar, iniciá sesión con tus credenciales del dashboard:

<code>/login tu@email.com contraseña</code>

Después podés usar <code>/ayuda</code> para ver todos los comandos.`;
}

async function handleLogin(
  admin: ReturnType<typeof createClient>,
  anonKey: string,
  supabaseUrl: string,
  chatId: number,
  args: string[]
): Promise<string> {
  if (args.length < 2) {
    return '❌ Uso: <code>/login email contraseña</code>';
  }

  const email = args[0];
  const password = args.slice(1).join(' '); // soporte contraseñas con espacios

  // Verificar credenciales con Supabase Auth
  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authData, error: authError } = await authClient.auth.signInWithPassword({ email, password });

  if (authError || !authData.user) {
    return '❌ Credenciales incorrectas. Verificá tu email y contraseña.';
  }

  // Obtener perfil
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile) {
    return '❌ No se encontró el perfil de usuario. Contactá al administrador.';
  }

  // Guardar sesión
  await admin.from('telegram_sessions').upsert({
    chat_id: chatId,
    user_id: authData.user.id,
    nombre: profile.nombre,
    rol: profile.rol,
    area_principal: profile.area_principal,
    areas_permitidas: profile.areas_permitidas || [],
    last_used_at: new Date().toISOString(),
  });

  const rolLabel = profile.rol === 'DEV' ? '⚡ DEV' : profile.rol === 'Admin' ? '🔧 Admin' : '👁 Lector';
  const areaLabel = profile.area_principal ? ` · ${profile.area_principal}` : '';

  return `✅ <b>Sesión iniciada</b>

👤 ${esc(profile.nombre)}
${rolLabel}${esc(areaLabel)}

Usá /ayuda para ver los comandos disponibles.`;
}

async function handleLogout(admin: ReturnType<typeof createClient>, chatId: number): Promise<string> {
  await admin.from('telegram_sessions').delete().eq('chat_id', chatId);
  return '👋 Sesión cerrada correctamente.';
}

function handleHelp(session: Session): string {
  const showFinanzas = canSeeFinanzas(session);

  return `📋 <b>Comandos disponibles</b>

🔍 <b>Búsquedas</b>
<code>/op NUMERO</code> — Buscar por N° de OP
<code>/cliente NOMBRE</code> — Proyectos por cliente
<code>/campanas</code> — Top campañas

📊 <b>Métricas</b>
<code>/metricas</code> — KPIs consolidados
<code>/metricas Creatividad</code> — KPIs por área
${showFinanzas ? '<code>/areas</code> — Métricas desglosadas por área\n' : ''}<code>/areas</code> — Ver mis áreas

🔐 <b>Sesión</b>
<code>/logout</code> — Cerrar sesión`;
}

async function handleMetricas(
  admin: ReturnType<typeof createClient>,
  session: Session,
  areaArg: string | null
): Promise<string> {
  const areaFilter = areaArg
    ? areaArg.charAt(0).toUpperCase() + areaArg.slice(1).toLowerCase()
    : null;

  const userAreas = getAreaFilter(session);

  let query = admin
    .from('projects')
    .select('tarifa,total_prod,margen_abs,margen_pct,gasto_estructura_valor,estado,area,deleted')
    .eq('deleted', false);

  if (areaFilter) {
    // Verificar que el usuario tiene acceso al área pedida
    if (userAreas && !userAreas.includes(areaFilter)) {
      return `❌ No tenés acceso al área <b>${esc(areaFilter)}</b>.`;
    }
    query = query.eq('area', areaFilter);
  } else if (userAreas) {
    query = query.in('area', userAreas);
  }

  const { data, error } = await query;
  if (error) return '❌ Error al obtener métricas.';

  const projects = (data || []).filter((p) => (Number(p.tarifa) || 0) > 0);
  if (projects.length === 0) {
    return `📊 No hay proyectos${areaFilter ? ` en ${areaFilter}` : ''}.`;
  }

  const total = projects.length;
  const realizados = projects.filter((p) => p.estado === 'Realizado').length;
  const presupuestados = total - realizados;

  const totalTarifa = projects.reduce((s, p) => s + (Number(p.tarifa) || 0), 0);
  const totalProd = projects.reduce((s, p) => s + (Number(p.total_prod) || 0), 0);
  const totalMargen = projects.reduce((s, p) => s + (Number(p.margen_abs) || 0), 0);
  const totalGasto = projects.reduce((s, p) => s + (Number(p.gasto_estructura_valor) || 0), 0);
  const margenPct = totalTarifa > 0 ? totalMargen / totalTarifa : 0;

  const titulo = areaFilter ? `${areaFilter}` : 'Consolidado';
  const showGasto = canSeeFinanzas(session);

  let msg = `📊 <b>Métricas — ${esc(titulo)}</b>\n\n`;
  msg += `📁 <b>Proyectos:</b> ${total} (${realizados} realizados · ${presupuestados} presupuestados)\n`;
  msg += `💰 <b>Tarifa total:</b> ${fmt(totalTarifa)}\n`;
  msg += `🏭 <b>Producción:</b> ${fmt(totalProd)}\n`;
  msg += `📈 <b>Margen:</b> ${fmt(totalMargen)} <i>(${pct(margenPct)})</i>\n`;

  if (showGasto) {
    const gananciaNeta = totalMargen - totalGasto;
    msg += `💸 <b>Gasto estructura:</b> ${fmt(totalGasto)}\n`;
    msg += `🏆 <b>Ganancia neta:</b> ${fmt(gananciaNeta)}\n`;
  }

  return msg;
}

async function handleOP(
  admin: ReturnType<typeof createClient>,
  session: Session,
  opQuery: string
): Promise<string> {
  if (!opQuery.trim()) return '❌ Uso: <code>/op NUMERO</code>\nEjemplo: <code>/op OP-2024-001</code>';

  const userAreas = getAreaFilter(session);

  let query = admin
    .from('projects')
    .select('op_numero,cliente,campaña,elemento,cantidad,tarifa,total_prod,margen_abs,margen_pct,estado,fecha,area,deleted')
    .eq('deleted', false)
    .ilike('op_numero', `%${opQuery.trim()}%`)
    .limit(5);

  if (userAreas) query = query.in('area', userAreas);

  const { data, error } = await query;
  if (error) return '❌ Error en la búsqueda.';

  const results = data || [];
  if (results.length === 0) return `🔍 No se encontró ninguna OP con "<b>${esc(opQuery)}</b>".`;

  let msg = `🔍 <b>Resultados para OP: ${esc(opQuery)}</b>\n`;
  if (results.length === 5) msg += `<i>(Mostrando primeros 5 resultados)</i>\n`;
  msg += '\n';

  for (const p of results) {
    const estadoBadge = p.estado === 'Realizado' ? '✅' : '📋';
    msg += `${estadoBadge} <b>${esc(p.op_numero || '—')}</b>\n`;
    msg += `👤 <b>Cliente:</b> ${esc(p.cliente || '—')}\n`;
    if (p.campaña) msg += `🎬 <b>Campaña:</b> ${esc(p.campaña)}\n`;
    if (p.elemento) msg += `📐 <b>Elemento:</b> ${esc(p.elemento)} × ${p.cantidad || 1}\n`;
    msg += `💰 <b>Tarifa:</b> ${fmt(Number(p.tarifa) || 0)}\n`;
    msg += `📈 <b>Margen:</b> ${fmt(Number(p.margen_abs) || 0)} <i>(${pct(Number(p.margen_pct) || 0)})</i>\n`;
    msg += `🏷 <b>Área:</b> ${esc(p.area || '—')} · 📅 ${fmtFecha(p.fecha)}\n`;
    if (results.length > 1) msg += '\n';
  }

  return msg;
}

async function handleCliente(
  admin: ReturnType<typeof createClient>,
  session: Session,
  clienteQuery: string
): Promise<string> {
  if (!clienteQuery.trim()) return '❌ Uso: <code>/cliente NOMBRE</code>\nEjemplo: <code>/cliente Disney</code>';

  const userAreas = getAreaFilter(session);

  let query = admin
    .from('projects')
    .select('cliente,campaña,tarifa,margen_abs,margen_pct,estado,area,fecha,deleted')
    .eq('deleted', false)
    .ilike('cliente', `%${clienteQuery.trim()}%`)
    .order('tarifa', { ascending: false })
    .limit(8);

  if (userAreas) query = query.in('area', userAreas);

  const { data, error } = await query;
  if (error) return '❌ Error en la búsqueda.';

  const results = data || [];
  if (results.length === 0) return `🔍 No se encontraron proyectos para "<b>${esc(clienteQuery)}</b>".`;

  // Agrupar totales
  const totalTarifa = results.reduce((s, p) => s + (Number(p.tarifa) || 0), 0);
  const totalMargen = results.reduce((s, p) => s + (Number(p.margen_abs) || 0), 0);
  const margenPct = totalTarifa > 0 ? totalMargen / totalTarifa : 0;

  let msg = `👤 <b>Cliente: ${esc(clienteQuery)}</b>\n`;
  msg += `📁 ${results.length} proyecto${results.length !== 1 ? 's' : ''} · 💰 ${fmt(totalTarifa)} · 📈 ${pct(margenPct)}\n\n`;

  for (const p of results.slice(0, 5)) {
    const estadoBadge = p.estado === 'Realizado' ? '✅' : '📋';
    msg += `${estadoBadge} ${esc(p.campaña || p.cliente || '—')} — ${fmt(Number(p.tarifa) || 0)}\n`;
    msg += `   🏷 ${esc(p.area || '—')} · 📅 ${fmtFecha(p.fecha)}\n`;
  }

  if (results.length > 5) msg += `\n<i>...y ${results.length - 5} más.</i>`;

  return msg;
}

async function handleCampanas(
  admin: ReturnType<typeof createClient>,
  session: Session
): Promise<string> {
  const userAreas = getAreaFilter(session);

  let query = admin
    .from('projects')
    .select('sheet,campaña,cliente,tarifa,margen_abs,area,deleted')
    .eq('deleted', false);

  if (userAreas) query = query.in('area', userAreas);

  const { data, error } = await query;
  if (error) return '❌ Error al obtener campañas.';

  const projects = (data || []).filter((p) => (Number(p.tarifa) || 0) > 0);

  // Agrupar por campaña/sheet
  const map: Record<string, { tarifa: number; margen: number; count: number; area: string }> = {};
  for (const p of projects) {
    const key = p.sheet || p.campaña || 'Sin campaña';
    if (!map[key]) map[key] = { tarifa: 0, margen: 0, count: 0, area: p.area || '—' };
    map[key].tarifa += Number(p.tarifa) || 0;
    map[key].margen += Number(p.margen_abs) || 0;
    map[key].count += 1;
  }

  const sorted = Object.entries(map)
    .sort(([, a], [, b]) => b.tarifa - a.tarifa)
    .slice(0, 8);

  if (sorted.length === 0) return '📋 No hay campañas registradas.';

  let msg = `🎬 <b>Top Campañas</b>\n\n`;
  for (const [name, stats] of sorted) {
    const margenPct = stats.tarifa > 0 ? (stats.margen / stats.tarifa * 100).toFixed(0) : 0;
    msg += `• <b>${esc(name)}</b>\n`;
    msg += `  💰 ${fmt(stats.tarifa)} · 📈 ${margenPct}% · 📁 ${stats.count} OPs\n`;
  }

  return msg;
}

async function handleAreas(
  admin: ReturnType<typeof createClient>,
  session: Session
): Promise<string> {
  const userAreas = getAreaFilter(session);
  const areas = userAreas ?? ['Creatividad', 'Producción', 'Trade', 'Finanzas', 'Comercial'];

  let query = admin
    .from('projects')
    .select('area,tarifa,margen_abs,deleted')
    .eq('deleted', false);

  if (userAreas) query = query.in('area', userAreas);

  const { data } = await query;
  const projects = (data || []).filter((p) => (Number(p.tarifa) || 0) > 0);

  const map: Record<string, { tarifa: number; margen: number; count: number }> = {};
  for (const a of areas) map[a] = { tarifa: 0, margen: 0, count: 0 };
  for (const p of projects) {
    if (p.area && map[p.area]) {
      map[p.area].tarifa += Number(p.tarifa) || 0;
      map[p.area].margen += Number(p.margen_abs) || 0;
      map[p.area].count += 1;
    }
  }

  let msg = `🗂 <b>Métricas por área</b>\n\n`;
  for (const area of areas) {
    const s = map[area];
    if (!s) continue;
    const margenPct = s.tarifa > 0 ? (s.margen / s.tarifa * 100).toFixed(0) : 0;
    msg += `<b>${esc(area)}</b>\n`;
    if (s.count > 0) {
      msg += `  💰 ${fmt(s.tarifa)} · 📈 ${margenPct}% · 📁 ${s.count}\n`;
    } else {
      msg += `  <i>Sin proyectos</i>\n`;
    }
  }

  return msg;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('OK');

  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN no está configurado');
    return new Response('OK');
  }

  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return new Response('OK');
  }

  const message = update.message;
  if (!message?.text) return new Response('OK');

  const chatId = message.chat.id;
  const rawText = message.text.trim();

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Parsear comando y argumentos
  const parts = rawText.split(/\s+/);
  const cmd = parts[0].toLowerCase().split('@')[0]; // ignorar @BotName
  const args = parts.slice(1);

  let response = '';

  try {
    if (cmd === '/start') {
      response = handleStart();
    } else if (cmd === '/login') {
      response = await handleLogin(admin, anonKey, supabaseUrl, chatId, args);
    } else if (cmd === '/logout') {
      response = await handleLogout(admin, chatId);
    } else {
      const session = await getSession(admin, chatId);
      if (!session) {
        response = `🔒 <b>No estás autenticado.</b>\n\nUsá <code>/login email contraseña</code> para iniciar sesión.`;
      } else {
        switch (cmd) {
          case '/ayuda':
          case '/help':
            response = handleHelp(session);
            break;
          case '/metricas':
          case '/métricas':
            response = await handleMetricas(admin, session, args[0] || null);
            break;
          case '/op':
            response = await handleOP(admin, session, args.join(' '));
            break;
          case '/cliente':
            response = await handleCliente(admin, session, args.join(' '));
            break;
          case '/campanas':
          case '/campañas':
            response = await handleCampanas(admin, session);
            break;
          case '/areas':
          case '/áreas':
            response = await handleAreas(admin, session);
            break;
          default:
            response = `❓ Comando no reconocido.\n\nUsá <code>/ayuda</code> para ver los disponibles.`;
        }
      }
    }
  } catch (err) {
    console.error('Error en handler:', err);
    response = '⚠️ Ocurrió un error inesperado. Intentá de nuevo.';
  }

  await sendMessage(botToken, chatId, response);
  return new Response('OK');
});
