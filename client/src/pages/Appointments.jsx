import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api, { errorMessage } from '../api';
import AppointmentCard from '../components/AppointmentCard';

export default function Appointments() {
  const location = useLocation();
  const [notice] = useState(location.state?.message || '');
  const [appointments, setAppointments] = useState([]);
  const [status, setStatus] = useState('all');
  const [openId, setOpenId] = useState('');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const res = await api.get('/appointments');
    setAppointments(res.data);
  }

  useEffect(() => {
    load()
      .catch((err) => setError(errorMessage(err, 'Could not load appointments')))
      .finally(() => setLoading(false));
  }, []);

  async function cancel(id) {
    if (!window.confirm('Cancel this appointment?')) return;
    setBusy(true);
    setError('');
    try {
      await api.put(`/appointments/${id}/cancel`);
      setOpenId('');
      await load();
    } catch (err) {
      setError(errorMessage(err, 'Could not cancel'));
    } finally {
      setBusy(false);
    }
  }

  async function openReschedule(appointment) {
    setError('');
    setOpenId(appointment._id);
    setSlots([]);
    try {
      const res = await api.get('/slots', {
        params: { doctorId: appointment.doctor._id, available: 'true' },
      });
      setSlots(res.data);
    } catch (err) {
      setError(errorMessage(err, 'Could not load slots'));
    }
  }

  async function reschedule(id, slot) {
    setBusy(true);
    setError('');
    try {
      await api.put(`/appointments/${id}/reschedule`, { date: slot.date, time: slot.time });
      setOpenId('');
      await load();
    } catch (err) {
      setError(errorMessage(err, 'Could not reschedule'));
    } finally {
      setBusy(false);
    }
  }

  const visible = appointments.filter((item) => status === 'all' || item.status === status);

  return (
    <section>
      <h1>Appointment history</h1>
      <p className="muted">Every visit on your account, including ones you cancelled.</p>
      {notice && <p className="success">{notice}</p>}
      {error && <p className="error">{error}</p>}
      <label className="filter">
        Show
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All</option>
          <option value="booked">Booked</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </label>
      {loading ? (
        <p className="page-note">Loading appointments...</p>
      ) : visible.length === 0 ? (
        <p className="page-note">Nothing in this list yet.</p>
      ) : (
        visible.map((item) => (
          <div key={item._id}>
            <AppointmentCard appointment={item}>
              {item.status === 'booked' && (
                <>
                  <button type="button" onClick={() => openReschedule(item)} disabled={busy}>
                    Reschedule
                  </button>
                  <button type="button" className="danger" onClick={() => cancel(item._id)} disabled={busy}>
                    Cancel
                  </button>
                </>
              )}
            </AppointmentCard>
            {openId === item._id && (
              <div className="reschedule">
                <p>Pick another open slot with this doctor.</p>
                {slots.length === 0 ? (
                  <p className="page-note">No other open slots.</p>
                ) : (
                  <div className="slot-list">
                    {slots.map((slot) => (
                      <button
                        type="button"
                        key={slot._id}
                        className="slot-btn"
                        disabled={busy}
                        onClick={() => reschedule(item._id, slot)}
                      >
                        {slot.date} {slot.time}
                      </button>
                    ))}
                  </div>
                )}
                <button type="button" className="secondary" onClick={() => setOpenId('')}>Close</button>
              </div>
            )}
          </div>
        ))
      )}
    </section>
  );
}
