require('dotenv').config();
const express = require('express');
const path = require('path');
const { initDb } = require('./lib/db');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(express.json());

app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes);

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`MPG All-Time en écoute sur le port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Échec initialisation DB', err);
    process.exit(1);
  });
