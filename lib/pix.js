const { createStaticPix, hasError } = require('pix-utils');

function stripAccents(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

async function buildGiftPix({ giftName, price }) {
  const amount = Number(price);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw Object.assign(new Error('Valor inválido.'), { status: 400 });
  }

  if (!process.env.PIX_KEY) {
    throw Object.assign(new Error('Chave PIX não configurada no servidor.'), { status: 500 });
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
    throw Object.assign(new Error('Não foi possível gerar o PIX.'), { status: 500 });
  }

  const brCode = pix.toBRCode();
  const qrCodeDataUrl = await pix.toImage();

  return { txid, brCode, qrCodeDataUrl, amount };
}

module.exports = { buildGiftPix };
