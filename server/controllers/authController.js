const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isValidEmail } = require('../utils/validate');

// Token stores the user id only. The role is always read from the database.
function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function publicUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

async function register(req, res) {
  try {
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Enter a valid email' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // Ignore any role sent by the browser. Signup is for patients only.
    const user = await User.create({ name, email, password, role: 'patient' });
    return res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }
    return res.status(500).json({ message: 'Could not register' });
  }
}

async function login(req, res) {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Password is hidden on the model, so login has to ask for it.
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    return res.json({ token: signToken(user._id), user: publicUser(user) });
  } catch (err) {
    return res.status(500).json({ message: 'Could not log in' });
  }
}

function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

module.exports = { register, login, me };
