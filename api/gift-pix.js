const { buildGiftPix } = require('../lib/pix');
const { sendEmail, sendToSheet } = require('../lib/notify');

function giftEmailHtml(r) {
  return `
    <p><strong>${r.convidado}</strong> selecionou o presente <strong>${r.presente}</strong> no valor de R$ ${r.valor.toFixed(2)}.</p>
    <ul>
      <li>E-mail: ${r.email || '-'}</li>
      <li>WhatsApp: ${r.whatsapp || '-'}</li>
      <li>ID da transação: ${r.txid}</li>
    </ul>
    <p>Confira o pagamento no seu banco (valor e horário) antes de enviar o convite manualmente.</p>
  `;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { giftName, price, guestName, guestEmail, guestPhone } = req.body || {};

  if (!giftName || !price || !guestName || !guestName.trim()) {
    res.status(400).json({ error: 'Dados incompletos.' });
    return;
  }

  let pix;
  try {
    pix = await buildGiftPix({ giftName, price });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
    return;
  }

  const record = {
    tipo: 'presente',
    presente: giftName,
    valor: pix.amount,
    convidado: guestName.trim(),
    email: guestEmail ? guestEmail.trim() : '',
    whatsapp: guestPhone ? guestPhone.trim() : '',
    txid: pix.txid,
    data: new Date().toISOString(),
  };

  await Promise.all([
    sendEmail({
      subject: `Presente selecionado: ${record.presente} (R$ ${record.valor.toFixed(2)})`,
      html: giftEmailHtml(record),
    }),
    sendToSheet(record),
  ]);

  res.status(200).json({ txid: pix.txid, brCode: pix.brCode, qrCodeDataUrl: pix.qrCodeDataUrl });
};
