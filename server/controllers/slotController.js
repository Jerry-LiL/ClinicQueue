const Doctor = require('../models/Doctor');
const Slot = require('../models/Slot');
const { isValidDate, isValidTime, todayString } = require('../utils/validate');

async function listSlots(req, res) {
  try {
    const filter = {};
    if (req.query.doctorId) filter.doctor = req.query.doctorId;
    if (req.query.date) filter.date = req.query.date;
    if (req.query.available === 'true') filter.isBooked = false;

    const slots = await Slot.find(filter).sort({ date: 1, time: 1 });
    res.json(slots);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid doctor id' });
    }
    return res.status(500).json({ message: 'Could not load slots' });
  }
}

async function createSlot(req, res) {
  try {
    const date = req.body.date;
    const time = req.body.time;

    if (!date || !time) {
      return res.status(400).json({ message: 'Date and time are required' });
    }
    if (!isValidDate(date) || !isValidTime(time)) {
      return res.status(400).json({ message: 'Use date YYYY-MM-DD and time HH:MM' });
    }
    if (date < todayString()) {
      return res.status(400).json({ message: 'Choose today or a future date' });
    }

    let doctor;
    if (req.user.role === 'doctor') {
      doctor = await Doctor.findOne({ user: req.user._id });
      if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });
    } else {
      if (!req.body.doctorId) {
        return res.status(400).json({ message: 'doctorId is required' });
      }
      doctor = await Doctor.findById(req.body.doctorId);
      if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    }

    const slot = await Slot.create({
      doctor: doctor._id,
      date,
      time,
      isBooked: false,
    });
    return res.status(201).json(slot);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'This slot already exists' });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid doctor id' });
    }
    return res.status(500).json({ message: 'Could not create slot' });
  }
}

async function deleteSlot(req, res) {
  try {
    const slot = await Slot.findById(req.params.id);
    if (!slot) return res.status(404).json({ message: 'Slot not found' });
    if (slot.isBooked) {
      return res.status(400).json({ message: 'Cannot delete a booked slot' });
    }

    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (!doctor || String(slot.doctor) !== String(doctor._id)) {
        return res.status(403).json({ message: 'You can only delete your own slots' });
      }
    }

    await slot.deleteOne();
    return res.json({ message: 'Slot deleted' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ message: 'Slot not found' });
    }
    return res.status(500).json({ message: 'Could not delete slot' });
  }
}

module.exports = { listSlots, createSlot, deleteSlot };
