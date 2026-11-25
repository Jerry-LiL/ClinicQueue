const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Slot = require('../models/Slot');
const { isValidDate, isValidTime, todayString } = require('../utils/validate');

function loadNames(appointment) {
  return appointment.populate([
    { path: 'doctor', select: 'name speciality fee' },
    { path: 'patient', select: 'name email' },
  ]);
}

// Only one request can flip a free slot to booked. The filter includes isBooked: false.
function claimSlot(doctor, date, time) {
  return Slot.findOneAndUpdate(
    { doctor, date, time, isBooked: false },
    { isBooked: true },
    { new: true }
  );
}

function freeSlot(doctor, date, time) {
  return Slot.updateOne({ doctor, date, time }, { isBooked: false });
}

function checkSlotInput(date, time) {
  if (!date || !time) return 'Date and time are required';
  if (!isValidDate(date) || !isValidTime(time)) return 'Use date YYYY-MM-DD and time HH:MM';
  if (date < todayString()) return 'Choose today or a future date';
  return '';
}

async function book(req, res) {
  try {
    const doctorId = req.body.doctorId;
    const date = req.body.date;
    const time = req.body.time;
    const reason = (req.body.reason || '').trim();
    const inputError = checkSlotInput(date, time);

    if (!doctorId) {
      return res.status(400).json({ message: 'Doctor, date and time are required' });
    }
    if (inputError) return res.status(400).json({ message: inputError });
    if (reason.length > 300) {
      return res.status(400).json({ message: 'Reason must be 300 characters or less' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    const slot = await claimSlot(doctorId, date, time);
    if (!slot) {
      return res.status(409).json({ message: 'That slot is not available' });
    }

    try {
      const appointment = await Appointment.create({
        patient: req.user._id,
        doctor: doctorId,
        date,
        time,
        reason,
        status: 'booked',
      });
      return res.status(201).json(await loadNames(appointment));
    } catch (err) {
      await freeSlot(doctorId, date, time);
      // 11000 is the duplicate key from the unique doctor + date + time index.
      if (err.code === 11000) {
        return res.status(409).json({ message: 'That slot was just booked by someone else' });
      }
      throw err;
    }
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid doctor id' });
    }
    return res.status(500).json({ message: 'Could not book appointment' });
  }
}

async function list(req, res) {
  try {
    // Patients see their own rows, doctors see theirs, admins see every row.
    const filter = {};

    if (req.user.role === 'patient') {
      filter.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (!doctor) return res.json([]);
      filter.doctor = doctor._id;
    }

    const appointments = await Appointment.find(filter)
      .populate('doctor', 'name speciality fee')
      .populate('patient', 'name email')
      .sort({ date: 1, time: 1 });

    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Could not load appointments' });
  }
}

async function reschedule(req, res) {
  try {
    const date = req.body.date;
    const time = req.body.time;
    const inputError = checkSlotInput(date, time);
    if (inputError) return res.status(400).json({ message: inputError });

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (String(appointment.patient) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only reschedule your own appointment' });
    }
    if (appointment.status !== 'booked') {
      return res.status(400).json({ message: 'Only a booked appointment can be rescheduled' });
    }
    if (appointment.date === date && appointment.time === time) {
      return res.status(400).json({ message: 'Pick a different slot' });
    }

    const slot = await claimSlot(appointment.doctor, date, time);
    if (!slot) {
      return res.status(409).json({ message: 'That slot is not available' });
    }

    const previousDate = appointment.date;
    const previousTime = appointment.time;
    appointment.date = date;
    appointment.time = time;

    try {
      await appointment.save();
    } catch (err) {
      await freeSlot(appointment.doctor, date, time);
      if (err.code === 11000) {
        return res.status(409).json({ message: 'That slot was just booked by someone else' });
      }
      throw err;
    }

    await freeSlot(appointment.doctor, previousDate, previousTime);
    return res.json(await loadNames(appointment));
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    return res.status(500).json({ message: 'Could not reschedule appointment' });
  }
}

async function cancel(req, res) {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (appointment.status !== 'booked') {
      return res.status(400).json({ message: 'Only a booked appointment can be cancelled' });
    }

    if (req.user.role === 'patient' && String(appointment.patient) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only cancel your own appointment' });
    }

    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (!doctor || String(appointment.doctor) !== String(doctor._id)) {
        return res.status(403).json({ message: 'You can only cancel your own appointments' });
      }
    }

    appointment.status = 'cancelled';
    await appointment.save();
    await freeSlot(appointment.doctor, appointment.date, appointment.time);
    return res.json(await loadNames(appointment));
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    return res.status(500).json({ message: 'Could not cancel appointment' });
  }
}

module.exports = { book, list, reschedule, cancel };
