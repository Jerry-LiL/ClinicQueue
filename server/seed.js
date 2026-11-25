require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Slot = require('./models/Slot');
const Appointment = require('./models/Appointment');

const TIMES = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

const DOCTORS = [
  {
    name: 'Dr. Priya Sharma',
    email: 'priya@clinicqueue.com',
    speciality: 'Cardiology',
    fee: 800,
    about: 'Heart checkups, blood pressure and cholesterol reviews.',
  },
  {
    name: 'Dr. Arjun Mehta',
    email: 'arjun@clinicqueue.com',
    speciality: 'Dermatology',
    fee: 600,
    about: 'Skin, hair and allergy consultations.',
  },
  {
    name: 'Dr. Neha Iyer',
    email: 'neha@clinicqueue.com',
    speciality: 'Pediatrics',
    fee: 700,
    about: 'Child health, vaccines and common illnesses.',
  },
  {
    name: 'Dr. Rohan Gupta',
    email: 'rohan@clinicqueue.com',
    speciality: 'Orthopedics',
    fee: 900,
    about: 'Bone, joint and sports injury visits.',
  },
];

function formatDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

async function seed() {
  await connectDB();

  await Appointment.deleteMany({});
  await Slot.deleteMany({});
  await Doctor.deleteMany({});
  await User.deleteMany({});

  await User.create({
    name: 'Clinic Admin',
    email: 'admin@clinicqueue.com',
    password: 'admin123',
    role: 'admin',
  });

  const patient = await User.create({
    name: 'Rahul Verma',
    email: 'rahul@clinicqueue.com',
    password: 'patient123',
    role: 'patient',
  });

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const createdDoctors = [];

  for (const info of DOCTORS) {
    const user = await User.create({
      name: info.name,
      email: info.email,
      password: 'doctor123',
      role: 'doctor',
    });

    const doctor = await Doctor.create({
      user: user._id,
      name: info.name,
      speciality: info.speciality,
      fee: info.fee,
      about: info.about,
    });
    createdDoctors.push(doctor);

    const slots = [];
    for (let offset = 0; offset < 5; offset += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);
      if (date.getDay() === 0) continue;
      for (const time of TIMES) {
        slots.push({
          doctor: doctor._id,
          date: formatDate(date),
          time,
          isBooked: false,
        });
      }
    }
    await Slot.insertMany(slots);
  }

  const priya = createdDoctors[0];
  const sampleSlot = await Slot.findOne({ doctor: priya._id }).sort({ date: 1, time: 1 });
  sampleSlot.isBooked = true;
  await sampleSlot.save();

  await Appointment.create({
    patient: patient._id,
    doctor: priya._id,
    date: sampleSlot.date,
    time: sampleSlot.time,
    reason: 'Blood pressure follow-up',
    status: 'booked',
  });

  console.log('Seeded ClinicQueue');
  console.log('Admin   admin@clinicqueue.com / admin123');
  console.log('Doctor  priya@clinicqueue.com / doctor123');
  console.log('Patient rahul@clinicqueue.com / patient123');
  await mongoose.connection.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
