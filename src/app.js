const express = require('express');
const path = require('node:path');

const app = express();
const host = '127.0.0.1';
const port = Number(process.env.PORT ?? '3000');

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(express.static(path.join(__dirname, '..', 'public')));

app.listen(port, host, () => {
  console.log(`Adaptive RL Coach en http://${host}:${port}`);
});