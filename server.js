require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const { createStaticPix, hasError } = require('pix-utils');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const GIFTS_FILE = path.join(DATA_DIR, 'presentes-selecionados.json');
const RSVP_FILE = path.join(DATA_DIR, 'rsvp-confirmacoes.json');

function stripAccents(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function readRecords(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return [];
  }
}

function saveRecord(file, record) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const records = readRecords(file);
  records.push(record);
  fs.writeFileSync(file, JSON.stringify(records, null, 2));
  return records;
}

/* ===== Admin layout (shared look for login + dashboard) ===== */
function adminLayout({ title, active, body }) {
  const nav = active
    ? `
    <header class="topbar">
      <span class="brand">Adrielle <span>&amp;</span> Adriel</span>
      <nav>
        <a href="/admin/rsvp" class="${active === 'rsvp' ? 'is-active' : ''}">Confirmações</a>
        <a href="/admin/presentes" class="${active === 'presentes' ? 'is-active' : ''}">Presentes</a>
        <a href="/admin/logout" class="logout">Sair</a>
      </nav>
    </header>`
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} — Painel Adrielle &amp; Adriel</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Cinzel:wght@500;600;700&display=swap" rel="stylesheet">
<style>
  :root{
    --olive-dark:#0b0910; --olive-mid:#b3355a; --olive-light:#c9a24b;
    --off-white:#14111a; --cream:#1c1720; --text-dark:#ECE4E6; --text-muted:#9c8f96; --white:#201a24;
    --font:'Cormorant Garamond', Georgia, serif; --font-heading:'Cinzel', Georgia, serif;
  }
  *{ box-sizing:border-box; margin:0; padding:0; }
  body{ font-family:var(--font); font-size:18px; color:var(--text-dark); background:var(--off-white); line-height:1.5; min-height:100vh; }
  a{ color:inherit; text-decoration:none; }
  .topbar{ display:flex; align-items:center; justify-content:space-between; padding:18px 32px; background:var(--white); border-bottom:1px solid rgba(201,162,75,.18); flex-wrap:wrap; gap:12px; }
  .brand{ font-family:var(--font-heading); font-weight:600; font-size:18px; letter-spacing:.02em; }
  .brand span{ color:var(--olive-mid); }
  .topbar nav{ display:flex; gap:24px; align-items:center; }
  .topbar nav a{ font-size:14px; color:var(--text-muted); font-weight:600; letter-spacing:.02em; transition:color .15s ease; }
  .topbar nav a:hover, .topbar nav a.is-active{ color:var(--olive-light); }
  .topbar nav a.logout{ color:var(--olive-mid); }
  main{ padding:32px; max-width:1200px; margin:0 auto; }
  h1{ font-family:var(--font-heading); font-weight:600; font-size:26px; letter-spacing:.02em; margin-bottom:24px; }
  .summary{ display:flex; gap:20px; margin-bottom:28px; flex-wrap:wrap; }
  .card{ background:var(--white); border:1px solid rgba(201,162,75,.15); border-radius:12px; padding:18px 22px; min-width:160px; }
  .card span{ font-size:11px; letter-spacing:2px; text-transform:uppercase; color:var(--text-muted); }
  .card strong{ display:block; font-size:28px; font-weight:700; margin-top:4px; }
  .table-wrap{ background:var(--white); border:1px solid rgba(201,162,75,.15); border-radius:12px; overflow:hidden; overflow-x:auto; }
  table{ width:100%; border-collapse:collapse; min-width:640px; }
  th, td{ padding:12px 16px; text-align:left; border-bottom:1px solid rgba(255,255,255,.05); font-size:14px; white-space:nowrap; }
  td{ white-space:normal; }
  th{ font-family:var(--font-heading); background:rgba(0,0,0,.2); text-transform:uppercase; font-size:10px; letter-spacing:1.5px; color:var(--text-muted); font-weight:600; }
  tr:last-child td{ border-bottom:none; }
  .yes{ color:#8fbf9a; font-weight:700; }
  .no{ color:#c9707e; font-weight:700; }
  .empty{ color:var(--text-muted); padding:40px; text-align:center; }
  .login-wrap{ min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; }
  .login-card{ background:var(--white); border:1px solid rgba(201,162,75,.2); border-radius:16px; padding:40px 32px; width:100%; max-width:380px; text-align:center; }
  .login-card .brand{ display:block; font-size:22px; margin-bottom:6px; }
  .login-card .eyebrow{ font-family:var(--font-heading); font-size:11px; letter-spacing:3px; text-transform:uppercase; color:var(--olive-mid); margin-bottom:28px; }
  .field{ text-align:left; margin-bottom:16px; }
  .field label{ display:block; font-size:12px; font-weight:600; margin-bottom:6px; }
  .field input{ font-family:var(--font); font-size:15px; color:var(--text-dark); background:var(--off-white); border:1px solid transparent; border-radius:8px; padding:12px 14px; width:100%; }
  .field input:focus{ outline:none; border-color:var(--olive-mid); }
  .btn{ font-family:var(--font); font-size:15px; font-weight:600; border:none; cursor:pointer; border-radius:999px; padding:13px 28px; width:100%; background:var(--olive-mid); color:var(--text-dark); margin-top:8px; }
  .btn:hover{ opacity:.9; }
  .error{ color:#e08a97; font-size:13px; font-weight:600; margin-bottom:16px; min-height:16px; }
</style>
</head>
<body>
${nav}
${body}
</body>
</html>`;
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.redirect('/admin/login');
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.ADMIN_SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 8 },
}));
app.use(express.static(__dirname));

app.get('/health', (req, res) => res.json({ ok: true }));

/* ===== Gift PIX ===== */
app.post('/api/gift-pix', async (req, res) => {
  const { giftName, price, guestName, guestEmail, guestPhone } = req.body || {};

  if (!giftName || !price || !guestName || !guestName.trim()) {
    return res.status(400).json({ error: 'Dados incompletos.' });
  }

  const amount = Number(price);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Valor inválido.' });
  }

  if (!process.env.PIX_KEY) {
    return res.status(500).json({ error: 'Chave PIX não configurada no servidor.' });
  }

  const txid = ('PRES' + Date.now().toString(36)).toUpperCase().slice(0, 25);

  const pix = createStaticPix({
    pixKey: process.env.PIX_KEY,
    merchantName: stripAccents(process.env.PIX_MERCHANT_NAME || '').toUpperCase().slice(0, 25),
    merchantCity: stripAccents(process.env.PIX_MERCHANT_CITY || '').toUpperCase().slice(0, 15),
    transactionAmount: amount,
    infoAdicional: stripAccents(giftName).slice(0, 50),
    txid,
  });

  if (hasError(pix)) {
    console.error('Erro ao gerar PIX:', pix);
    return res.status(500).json({ error: 'Não foi possível gerar o PIX.' });
  }

  const brCode = pix.toBRCode();
  const qrCodeDataUrl = await pix.toImage();

  saveRecord(GIFTS_FILE, {
    txid,
    giftName,
    price: amount,
    guestName: guestName.trim(),
    guestEmail: guestEmail ? guestEmail.trim() : null,
    guestPhone: guestPhone ? guestPhone.trim() : null,
    createdAt: new Date().toISOString(),
  });

  res.json({ txid, brCode, qrCodeDataUrl });
});

/* ===== RSVP ===== */
app.post('/api/rsvp', (req, res) => {
  const { nome, presenca, adultos, criancas, email, telefone, obs } = req.body || {};

  if (!nome || !nome.trim() || (presenca !== 'sim' && presenca !== 'nao')) {
    return res.status(400).json({ error: 'Dados incompletos.' });
  }

  saveRecord(RSVP_FILE, {
    nome: nome.trim(),
    presenca,
    adultos: Number(adultos) || 0,
    criancas: Number(criancas) || 0,
    email: email ? email.trim() : null,
    telefone: telefone ? telefone.trim() : null,
    obs: obs ? obs.trim() : null,
    createdAt: new Date().toISOString(),
  });

  res.json({ ok: true });
});

/* ===== Admin: login ===== */
app.get('/admin', (req, res) => res.redirect(req.session && req.session.isAdmin ? '/admin/rsvp' : '/admin/login'));

app.get('/admin/login', (req, res) => {
  if (req.session && req.session.isAdmin) return res.redirect('/admin/rsvp');

  res.send(adminLayout({
    title: 'Entrar',
    active: null,
    body: `
    <div class="login-wrap">
      <div class="login-card">
        <span class="brand">Adrielle <span style="color:var(--olive-mid)">&amp;</span> Adriel</span>
        <p class="eyebrow">Painel administrativo</p>
        <p class="error"></p>
        <form method="POST" action="/admin/login">
          <div class="field">
            <label for="user">Usuário</label>
            <input type="text" id="user" name="user" autocomplete="username" required autofocus>
          </div>
          <div class="field">
            <label for="pass">Senha</label>
            <input type="password" id="pass" name="pass" autocomplete="current-password" required>
          </div>
          <button type="submit" class="btn">Entrar</button>
        </form>
      </div>
    </div>`,
  }));
});

app.post('/admin/login', (req, res) => {
  const { user, pass } = req.body || {};
  const expectedUser = process.env.ADMIN_USER || 'admin';
  const expectedPass = process.env.ADMIN_PASSWORD;

  if (expectedPass && user === expectedUser && pass === expectedPass) {
    req.session.isAdmin = true;
    return res.redirect('/admin/rsvp');
  }

  res.send(adminLayout({
    title: 'Entrar',
    active: null,
    body: `
    <div class="login-wrap">
      <div class="login-card">
        <span class="brand">Adrielle <span style="color:var(--olive-mid)">&amp;</span> Adriel</span>
        <p class="eyebrow">Painel administrativo</p>
        <p class="error">Usuário ou senha incorretos.</p>
        <form method="POST" action="/admin/login">
          <div class="field">
            <label for="user">Usuário</label>
            <input type="text" id="user" name="user" value="${escapeHtml(user || '')}" autocomplete="username" required autofocus>
          </div>
          <div class="field">
            <label for="pass">Senha</label>
            <input type="password" id="pass" name="pass" autocomplete="current-password" required>
          </div>
          <button type="submit" class="btn">Entrar</button>
        </form>
      </div>
    </div>`,
  }));
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

/* ===== Admin: RSVP dashboard ===== */
app.get('/admin/rsvp', requireAdmin, (req, res) => {
  const rsvps = readRecords(RSVP_FILE).slice().reverse();
  const confirmados = rsvps.filter((r) => r.presenca === 'sim');
  const naoVao = rsvps.filter((r) => r.presenca === 'nao');
  const totalPessoas = confirmados.reduce((sum, r) => sum + (r.adultos || 0) + (r.criancas || 0), 0);

  const rows = rsvps.map((r) => `
    <tr>
      <td>${escapeHtml(r.nome)}</td>
      <td class="${r.presenca === 'sim' ? 'yes' : 'no'}">${r.presenca === 'sim' ? 'Sim' : 'Não'}</td>
      <td>${escapeHtml(r.adultos)}</td>
      <td>${escapeHtml(r.criancas)}</td>
      <td>${escapeHtml(r.email)}</td>
      <td>${escapeHtml(r.telefone)}</td>
      <td>${escapeHtml(r.obs)}</td>
      <td>${escapeHtml(new Date(r.createdAt).toLocaleString('pt-BR'))}</td>
    </tr>`).join('');

  res.send(adminLayout({
    title: 'Confirmações',
    active: 'rsvp',
    body: `
    <main>
      <h1>Confirmações de presença</h1>
      <div class="summary">
        <div class="card"><span>Confirmados</span><strong>${confirmados.length}</strong></div>
        <div class="card"><span>Não vão</span><strong>${naoVao.length}</strong></div>
        <div class="card"><span>Total de pessoas</span><strong>${totalPessoas}</strong></div>
      </div>
      <div class="table-wrap">
        ${rsvps.length === 0 ? '<p class="empty">Nenhuma confirmação recebida ainda.</p>' : `
        <table>
          <thead><tr><th>Nome</th><th>Vai?</th><th>Adultos</th><th>Crianças</th><th>E-mail</th><th>Telefone</th><th>Observações</th><th>Recebido em</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`}
      </div>
    </main>`,
  }));
});

/* ===== Admin: gift selections dashboard ===== */
app.get('/admin/presentes', requireAdmin, (req, res) => {
  const gifts = readRecords(GIFTS_FILE).slice().reverse();
  const totalValor = gifts.reduce((sum, g) => sum + (g.price || 0), 0);

  const rows = gifts.map((g) => `
    <tr>
      <td>${escapeHtml(g.giftName)}</td>
      <td>${escapeHtml(g.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))}</td>
      <td>${escapeHtml(g.guestName)}</td>
      <td>${escapeHtml(g.guestEmail)}</td>
      <td>${escapeHtml(g.guestPhone)}</td>
      <td>${escapeHtml(g.txid)}</td>
      <td>${escapeHtml(new Date(g.createdAt).toLocaleString('pt-BR'))}</td>
    </tr>`).join('');

  res.send(adminLayout({
    title: 'Presentes',
    active: 'presentes',
    body: `
    <main>
      <h1>Presentes selecionados</h1>
      <div class="summary">
        <div class="card"><span>Seleções</span><strong>${gifts.length}</strong></div>
        <div class="card"><span>Valor total</span><strong>${totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>
      </div>
      <div class="table-wrap">
        ${gifts.length === 0 ? '<p class="empty">Nenhum presente selecionado ainda.</p>' : `
        <table>
          <thead><tr><th>Presente</th><th>Valor</th><th>Convidado</th><th>E-mail</th><th>WhatsApp</th><th>ID</th><th>Selecionado em</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`}
      </div>
      <p style="color:var(--text-muted); font-size:13px; margin-top:16px;">Confira o pagamento no seu banco pelo valor e horário antes de enviar o convite manualmente.</p>
    </main>`,
  }));
});

app.listen(PORT, () => {
  console.log(`Site do casal rodando em http://localhost:${PORT}`);
});
