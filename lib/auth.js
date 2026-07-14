const jwt = require('jsonwebtoken');

function checkAdminPassword(password) {
  return typeof password === 'string' && password === process.env.ADMIN_PASSWORD;
}

function signToken() {
  return jwt.sign({ admin: true }, process.env.JWT_SECRET, { expiresIn: '90d' });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Non authentifié' });
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Session invalide, reconnecte-toi' });
  }
}

module.exports = { checkAdminPassword, signToken, requireAuth };
