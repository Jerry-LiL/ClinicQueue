import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api';
import AppointmentCard from '../components/AppointmentCard';
import { todayInput } from '../dates';

const emptySlot = { date: '', time: '' };

export default function DoctorDashboard() {
  const [profile, setProfile] = useState(null);
  const [openCount, setOpenCount] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [slotForm, setSlotForm] = useState(emptySlot);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    const meRes = await api.get('/doctors/me');
    const [slotRes, appointmentRes] = await Promise.all([
      api.get('/slots', { params: { doctorId: meRes.data._id, available: 'true' } }),
      api.get('/appointments'),
    ]);
    setProfile(meRes.data);
    setOpenCount(slotRes.data.length);
    setAppointments(appointmentRes.data);
  }

  useEffect(() => {
    load()
      .catch((err) => setError(errorMessage(err, 'Could not load your schedule')))
      .finally(() => setLoading(false));
  }, []);

  function updateSlot(event) {
    setSlotForm({ ...slotForm, [event.target.name]: event.target.value });
  }

  async function addSlot(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.post('/slots', {
        date: slotForm.date,
        time: slotForm.time.slice(0, 5),
      });
      setSlotForm(emptySlot);
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
      <h1>{profile ? profile.name : 'My schedule'}</h1>
      <p className="muted">
        {profile?.speciality} · {openCount} open slot{openCount === 1 ? '' : 's'}
      </p>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}

      <form className="card" onSubmit={addSlot}>
        <h2>Open a slot</h2>
        <div className="inline-fields">
          <label>
            Date
            <input type="date" name="date" min={todayInput()} value={slotForm.date} onChange={updateSlot} required />
          </label>
          <label>
            Time
            <input type="time" name="time" step="1800" value={slotForm.time} onChange={updateSlot} required />
          </label>
        </div>
        <button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Add slot'}</button>
      </form>

      <h2>Appointments</h2>
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
