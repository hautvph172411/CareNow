const express = require('express');
const app = express();

app.use(express.json());

const ALLOWED_ORIGINS = [
  'http://localhost:5173', // carenow-admin
  'http://localhost:5174', // carenow-client
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

const routes = require('./routes');
app.use('/api', routes);
module.exports = app;
