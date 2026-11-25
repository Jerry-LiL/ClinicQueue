import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errorMessage } from '../api';

function groupByDate(slots) {
  const groups = {};
  for (const slot of slots) {
    if (!groups[slot.date]) groups[slot.date] = [];
    groups[slot.date].push(slot);
  }
  return groups;
}

export default function DoctorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/doctors/${id}`),
      api.get('/slots', { params: { doctorId: id, available: 'true' } }),
    ])
      .then(([doctorRes, slotRes]) => {
        setDoctor(doctorRes.data);
        setSlots(slotRes.data);
      })
      .catch((err) => setError(errorMessage(err, 'Could not load this doctor')))
      .finally(() => setLoading(false));
  }, [id]);

  async function refreshSlots() {
    const res = await api.get('/slots', { params: { doctorId: id, available: 'true' } });
    setSlots(res.data);
    setSelected(null);
  }

  async function book(event) {
    event.preventDefault();
    if (!selected) {
      setError('Pick a slot first');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await api.post('/appointments', {
        doctorId: id,
        date: selected.date,
        time: selected.time,
        reason,
      });
      navigate('/appointments', { state: { message: 'Appointment booked.' } });
    } catch (err) {
      setError(errorMessage(err, 'Could not book that slot'));
      try {
        await refreshSlots();
      } catch (refreshErr) {
        setError(errorMessage(refreshErr, 'Could not refresh slots'));
      }
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="page-note">Loading...</p>;
  if (!doctor) return <p className="error">{error || 'Doctor not found'}</p>;

  const grouped = groupByDate(slots);
  const dates = Object.keys(grouped);

  return (
    <section>
      <p><Link to="/doctors">Back to doctors</Link></p>
      <h1>{doctor.name}</h1>
      <p className="speciality">{doctor.speciality}</p>
      <p className="fee">Fee ₹{doctor.fee}</p>
      <p>{doctor.about}</p>

      <h2>Open slots</h2>
      {dates.length === 0 ? (
        <p className="page-note">No open slots right now.</p>
      ) : (
        dates.map((date) => (
          <div className="slot-group" key={date}>
            <h3>{date}</h3>
            <div className="slot-list">
              {grouped[date].map((slot) => (
                <button
                  type="button"
                  key={slot._id}
                  className={selected?._id === slot._id ? 'slot-btn active' : 'slot-btn'}
                  onClick={() => setSelected(slot)}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          </div>
        ))
      )}

      <form className="card book-form" onSubmit={book}>
        <h2>Book this doctor</h2>
        <p className="muted">
          {selected ? `Selected ${selected.date} at ${selected.time}` : 'Choose a time above.'}
        </p>
        <label>
          Reason (optional)
          <textarea
            rows={3}
            maxLength={300}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={busy || !selected}>
          {busy ? 'Booking...' : 'Confirm booking'}
        </button>
      </form>
    </section>
  );
}
