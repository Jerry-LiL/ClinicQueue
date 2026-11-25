import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api';
import AppointmentCard from '../components/AppointmentCard';
import { todayInput } from '../dates';

const emptyDoctor = {
  name: '',
  email: '',
  password: '',
  speciality: '',
  fee: '',
  about: '',
};

const emptySlot = { doctorId: '', date: '', time: '' };

export default function AdminDashboard() {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctorForm, setDoctorForm] = useState(emptyDoctor);
  const [slotForm, setSlotForm] = useState(emptySlot);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [doctorRes, appointmentRes] = await Promise.all([
      api.get('/doctors'),
      api.get('/appointments'),
    ]);
    setDoctors(doctorRes.data);
    setAppointments(appointmentRes.data);
  }

  useEffect(() => {
    load()
      .catch((err) => setError(errorMessage(err, 'Could not load admin data')))
      .finally(() => setLoading(false));
  }, []);

  function updateDoctor(event) {
    setDoctorForm({ ...doctorForm, [event.target.name]: event.target.value });
  }

  function updateSlot(event) {
    setSlotForm({ ...slotForm, [event.target.name]: event.target.value });
  }

  async function addDoctor(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.post('/doctors', { ...doctorForm, fee: Number(doctorForm.fee) });
      setDoctorForm(emptyDoctor);
      setMessage('Doctor added. They can log in with the email and password you set.');
      await load();
    } catch (err) {
      setError(errorMessage(err, 'Could not add doctor'));
    } finally {
      setBusy(false);
    }
  }

  async function addSlot(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.post('/slots', {
        doctorId: slotForm.doctorId,
        date: slotForm.date,
        time: slotForm.time.slice(0, 5),
      });
      setSlotForm({ ...emptySlot, doctorId: slotForm.doctorId });
      setMessage('Slot added.');
      await load();
    } catch (err) {
      setError(errorMessage(err, 'Could not add slot'));
    } finally {
      setBusy(false);
    }
  }

  async function cancel(id) {
    if (!window.confirm('Cancel this appointment?')) return;
    setBusy(true);
    setError('');
    try {
      await api.put(`/appointments/${id}/cancel`);
      setMessage('Appointment cancelled.');
      await load();
    } catch (err) {
      setError(errorMessage(err, 'Could not cancel'));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="page-note">Loading...</p>;

  return (
    <section>
      <h1>Admin</h1>
      <p className="muted">Add a doctor login, open slots, and review every appointment.</p>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}

      <div className="split">
        <form className="card" onSubmit={addDoctor}>
          <h2>Add a doctor</h2>
          <label>
            Name
            <input name="name" value={doctorForm.name} onChange={updateDoctor} required />
          </label>
          <label>
            Email
            <input type="email" name="email" value={doctorForm.email} onChange={updateDoctor} required />
          </label>
          <label>
            Password
            <input type="password" name="password" minLength={6} value={doctorForm.password} onChange={updateDoctor} required />
          </label>
          <label>
            Speciality
            <input name="speciality" value={doctorForm.speciality} onChange={updateDoctor} required />
          </label>
          <label>
            Fee (₹)
            <input type="number" min="0" name="fee" value={doctorForm.fee} onChange={updateDoctor} required />
          </label>
          <label>
            About
            <textarea name="about" rows={3} maxLength={400} value={doctorForm.about} onChange={updateDoctor} />
          </label>
          <button type="submit" disabled={busy}>Add doctor</button>
        </form>

        <form className="card" onSubmit={addSlot}>
          <h2>Open a slot</h2>
          <label>
            Doctor
            <select name="doctorId" value={slotForm.doctorId} onChange={updateSlot} required>
              <option value="">Select</option>
              {doctors.map((doctor) => (
                <option key={doctor._id} value={doctor._id}>
                  {doctor.name} ({doctor.speciality})
                </option>
              ))}
            </select>
          </label>
          <label>
            Date
            <input type="date" name="date" min={todayInput()} value={slotForm.date} onChange={updateSlot} required />
          </label>
          <label>
            Time
            <input type="time" name="time" step="1800" value={slotForm.time} onChange={updateSlot} required />
          </label>
          <button type="submit" disabled={busy}>Add slot</button>
        </form>
      </div>

      <h2>All appointments</h2>
      {appointments.length === 0 ? (
        <p className="page-note">No appointments yet.</p>
      ) : (
        appointments.map((item) => (
          <AppointmentCard key={item._id} appointment={item} showPatient>
            {item.status === 'booked' && (
              <button type="button" className="danger" onClick={() => cancel(item._id)} disabled={busy}>
                Cancel
              </button>
            )}
          </AppointmentCard>
        ))
      )}
    </section>
  );
}
