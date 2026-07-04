require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/api/rsvp', require('./api/rsvp'));
app.post('/api/gift-pix', require('./api/gift-pix'));

app.listen(PORT, () => {
  console.log(`Site do casal rodando em http://localhost:${PORT}`);
});
