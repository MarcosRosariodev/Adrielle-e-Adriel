async function sendEmail({ subject, html }) {
  if (!process.env.RESEND_API_KEY || !process.env.NOTIFY_EMAIL_TO) {
    console.warn('Envio de e-mail ignorado: RESEND_API_KEY ou NOTIFY_EMAIL_TO não configurados.');
    return;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.NOTIFY_EMAIL_FROM || 'onboarding@resend.dev',
        to: process.env.NOTIFY_EMAIL_TO,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      console.error('Falha ao enviar e-mail:', res.status, await res.text());
    }
  } catch (err) {
    console.error('Erro ao chamar a API do Resend:', err);
  }
}

async function sendToSheet(payload) {
  const url = process.env.SHEETS_WEBHOOK_URL;
  if (!url) {
    console.warn('Envio para planilha ignorado: SHEETS_WEBHOOK_URL não configurada.');
    return;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error('Falha ao enviar para a planilha:', res.status, await res.text());
    }
  } catch (err) {
    console.error('Erro ao chamar o webhook da planilha:', err);
  }
}

module.exports = { sendEmail, sendToSheet };
