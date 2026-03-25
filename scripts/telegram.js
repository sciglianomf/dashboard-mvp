#!/usr/bin/env node
/**
 * Telegram notification & interactive prompt for Claude Code sessions.
 *
 * Usage:
 *   node scripts/telegram.js send "mensaje"
 *   node scripts/telegram.js ask "¿Continúo?" "Sí" "No"
 *   node scripts/telegram.js ask "¿Continúo?"          ← usa botones default: Sí / No / Continuar
 *
 * Env vars (leídos desde backend/.env automáticamente):
 *   TELEGRAM_BOT_TOKEN
 *   TELEGRAM_CHAT_ID
 */

const https   = require('https');
const fs      = require('fs');
const path    = require('path');

// ── Load .env from backend/.env ─────────────────────────────────────────────
const envPath = path.join(__dirname, '../backend/.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([^#=\s][^=]*?)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  });
}

const TOKEN   = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TOKEN || !CHAT_ID) {
  console.error('❌  Faltan TELEGRAM_BOT_TOKEN y/o TELEGRAM_CHAT_ID en backend/.env');
  process.exit(1);
}

// ── HTTP helper ──────────────────────────────────────────────────────────────
function tgRequest(method, body = {}) {
  return new Promise((resolve, reject) => {
    const data    = JSON.stringify(body);
    const options = {
      hostname: 'api.telegram.org',
      path:     `/bot${TOKEN}/${method}`,
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    };
    const req = https.request(options, res => {
      let raw = '';
      res.on('data', chunk => (raw += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ── send ─────────────────────────────────────────────────────────────────────
async function send(text) {
  await tgRequest('sendMessage', {
    chat_id:    CHAT_ID,
    text,
    parse_mode: 'HTML',
  });
}

// ── ask (sends buttons, polls for callback, prints answer) ──────────────────
async function ask(text, buttons) {
  // Skip old updates — get current offset
  const init = await tgRequest('getUpdates', { limit: 1, offset: -1, timeout: 0 });
  let offset = init.result?.length
    ? init.result[init.result.length - 1].update_id + 1
    : 0;

  // Send message with inline keyboard
  const msg = await tgRequest('sendMessage', {
    chat_id:      CHAT_ID,
    text,
    parse_mode:   'HTML',
    reply_markup: {
      inline_keyboard: [
        buttons.map(b => ({ text: b, callback_data: b })),
      ],
    },
  });

  const msgId = msg.result?.message_id;

  // Poll until user taps a button
  while (true) {
    const res = await tgRequest('getUpdates', {
      timeout:          30,
      offset,
      allowed_updates:  ['message', 'callback_query'],
    });

    for (const update of res.result || []) {
      offset = update.update_id + 1;
      const cq = update.callback_query;
      if (!cq) continue;

      const answer = cq.data;

      // Acknowledge button tap (removes loading spinner)
      await tgRequest('answerCallbackQuery', { callback_query_id: cq.id });

      // Edit original message to show what was selected
      if (msgId) {
        await tgRequest('editMessageText', {
          chat_id:    CHAT_ID,
          message_id: msgId,
          text:       `${text}\n\n✅ <b>${answer}</b>`,
          parse_mode: 'HTML',
        }).catch(() => {});
      }

      process.stdout.write(answer + '\n');
      process.exit(0);
    }
  }
}

// ── CLI entry ────────────────────────────────────────────────────────────────
const [,, command, ...args] = process.argv;

if (command === 'send') {
  send(args.join(' '))
    .then(() => process.exit(0))
    .catch(e => { console.error(e.message); process.exit(1); });

} else if (command === 'ask') {
  const text    = args[0] || '¿Continúo?';
  const buttons = args.slice(1).length ? args.slice(1) : ['Sí ✅', 'No ❌', 'Continuar ▶'];
  ask(text, buttons)
    .catch(e => { console.error(e.message); process.exit(1); });

} else {
  console.error('Uso:\n  node telegram.js send "mensaje"\n  node telegram.js ask "pregunta" "Btn1" "Btn2"');
  process.exit(1);
}
