const { sendEmail, sendToSheet } = require('../lib/notify');

function rsvpEmailHtml(r) {
  return `
    <p><strong>${r.nome}</strong> ${r.presenca === 'sim' ? 'confirmou presença' : 'avisou que não vai poder ir'}.</p>
    <ul>
      <li>Adultos: ${r.adultos}</li>
      <li>Crianças: ${r.criancas}</li>
      <li>E-mail: ${r.email || '-'}</li>
      <li>Telefone: ${r.telefone || '-'}</li>
      <li>Observações: ${r.obs || '-'}</li>
    </ul>
  `;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { nome, presenca, adultos, criancas, email, telefone, obs } = req.body || {};

  if (!nome || !nome.trim() || (presenca !== 'sim' && presenca !== 'nao')) {
    res.status(400).json({ error: 'Dados incompletos.' });
    return;
  }

  const record = {
    tipo: 'rsvp',
    nome: nome.trim(),
    presenca,
    adultos: Number(adultos) || 0,
    criancas: Number(criancas) || 0,
    email: email ? email.trim() : '',
    telefone: telefone ? telefone.trim() : '',
    obs: obs ? obs.trim() : '',
    data: new Date().toISOString(),
  };

  await Promise.all([
    sendEmail({
      subject: `RSVP: ${record.nome} — ${record.presenca === 'sim' ? 'Confirmado' : 'Não vai'}`,
      html: rsvpEmailHtml(record),
    }),
    sendToSheet(record),
  ]);

  res.status(200).json({ ok: true });
};
