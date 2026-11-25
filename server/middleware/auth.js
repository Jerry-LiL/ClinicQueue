const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Reads the Bearer token, checks it, and puts the user on the request.
async function protect(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return res.status(401).json({ message: 'Login required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Login required' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Login required' });
  }
}

// Use after protect. Example: allowRoles('patient', 'admin')
function allowRoles(...roles) {
  return function checkRole(req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have access to this' });
    }
    next();
  };
}

module.exports = { protect, allowRoles };
