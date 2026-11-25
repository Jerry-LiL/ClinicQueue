const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { isValidEmail, escapeRegex } = require('../utils/validate');

function publicDoctor(doctor) {
  return {
    _id: doctor._id,
    name: doctor.name,
    speciality: doctor.speciality,
    fee: doctor.fee,
    about: doctor.about,
  };
}

async function listDoctors(req, res) {
  try {
    const filter = {};
    const name = (req.query.name || '').trim();
    const speciality = (req.query.speciality || '').trim();

    if (name) filter.name = new RegExp(escapeRegex(name), 'i');
    if (speciality) filter.speciality = new RegExp(`^${escapeRegex(speciality)}$`, 'i');

    const doctors = await Doctor.find(filter).sort({ name: 1 });
    res.json(doctors.map(publicDoctor));
  } catch (err) {
    res.status(500).json({ message: 'Could not load doctors' });
  }
}

async function getDoctor(req, res) {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(publicDoctor(doctor));
  } catch (err) {
    res.status(404).json({ message: 'Doctor not found' });
  }
}

async function getMyDoctor(req, res) {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });
    res.json(publicDoctor(doctor));
  } catch (err) {
    res.status(500).json({ message: 'Could not load profile' });
  }
}

async function createDoctor(req, res) {
  try {
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';
    const speciality = (req.body.speciality || '').trim();
    const about = (req.body.about || '').trim();
    const fee = Number(req.body.fee);

    if (!name || !email || !password || !speciality || req.body.fee === undefined || req.body.fee === '') {
      return res.status(400).json({ message: 'Name, email, password, speciality and fee are required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Enter a valid email' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (!Number.isFinite(fee) || fee < 0) {
      return res.status(400).json({ message: 'Fee must be zero or a positive number' });
    }
    if (about.length > 400) {
      return res.status(400).json({ message: 'About must be 400 characters or less' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({ name, email, password, role: 'doctor' });

    try {
      const doctor = await Doctor.create({
        user: user._id,
        name,
        speciality,
        fee,
        about,
      });
      return res.status(201).json(publicDoctor(doctor));
    } catch (err) {
      await User.deleteOne({ _id: user._id });
      if (err.code === 11000) {
        return res.status(400).json({ message: 'An account with this email already exists' });
      }
      throw err;
    }
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }
    return res.status(500).json({ message: 'Could not add doctor' });
  }
}

module.exports = { listDoctors, getDoctor, getMyDoctor, createDoctor };
