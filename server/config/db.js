const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Slot = require('../models/Slot');
const Appointment = require('../models/Appointment');

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is missing. Copy .env.example to .env');
  }
  await mongoose.connect(uri);
  // Wait until indexes exist, including the unique doctor + date + time booking index.
  await User.init();
  await Doctor.init();
  await Slot.init();
  await Appointment.init();
  console.log('MongoDB connected');
}

module.exports = connectDB;
