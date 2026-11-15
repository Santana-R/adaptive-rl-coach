const express = require('express');
const path = require('node:path');
const blocksRouter = require('./routes/blocks');

const app = express();
const host = '127.0.0.1';
const port = Number(process.env.PORT ?? '3000');

app.use(express.raw({
  type: request => request.headers['content-type']?.startsWith('multipart/form-data'),
  limit: '100mb'
}));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1/blocks', blocksRouter);
app.use(express.static(path.join(__dirname, '..', 'public')));

if (require.main === module) {
  app.listen(port, host, () => {
    console.log(`Adaptive RL Coach en http://${host}:${port}`);
  });
}

module.exports = app;