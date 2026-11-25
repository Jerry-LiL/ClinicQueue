const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true, trim: true },
    speciality: { type: String, required: true, trim: true },
    fee: { type: Number, required: true, min: 0 },
    about: { type: String, default: '', trim: true },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Doctor', doctorSchema);
