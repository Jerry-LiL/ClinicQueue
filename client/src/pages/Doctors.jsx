import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api';

export default function Doctors() {
  const [name, setName] = useState('');
  const [speciality, setSpeciality] = useState('');
  const [specialities, setSpecialities] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/doctors')
      .then((res) => {
        const values = [];
        for (const doctor of res.data) {
          if (!values.includes(doctor.speciality)) values.push(doctor.speciality);
        }
        values.sort();
        setSpecialities(values);
        setDoctors(res.data);
      })
      .catch((err) => setError(errorMessage(err, 'Could not load doctors')))
      .finally(() => setLoading(false));
  }, []);

  async function search(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const params = {};
      if (name.trim()) params.name = name.trim();
      if (speciality) params.speciality = speciality;
      const res = await api.get('/doctors', { params });
      setDoctors(res.data);
    } catch (err) {
      setError(errorMessage(err, 'Could not load doctors'));
    } finally {
      setLoading(false);
    }
  }

  async function clearFilters() {
    setName('');
    setSpeciality('');
    setError('');
    setLoading(true);
    try {
      const res = await api.get('/doctors');
      setDoctors(res.data);
    } catch (err) {
      setError(errorMessage(err, 'Could not load doctors'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h1>Doctors</h1>
      <p className="muted">Search by name and filter by speciality, then open a doctor to book a slot.</p>
      <form className="search-bar card" onSubmit={search}>
        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Priya" />
        </label>
        <label>
          Speciality
          <select value={speciality} onChange={(event) => setSpeciality(event.target.value)}>
            <option value="">All</option>
            {specialities.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <button type="submit">Search</button>
        <button type="button" className="secondary" onClick={clearFilters}>Clear</button>
      </form>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="page-note">Loading doctors...</p>
      ) : doctors.length === 0 ? (
        <p className="page-note">No doctors match that search.</p>
      ) : (
        <div className="doctor-grid">
          {doctors.map((doctor) => (
            <article className="doctor-card" key={doctor._id}>
              <h2>{doctor.name}</h2>
              <p className="speciality">{doctor.speciality}</p>
              <p className="fee">Fee ₹{doctor.fee}</p>
              <p>{doctor.about}</p>
              <Link className="button" to={`/doctors/${doctor._id}`}>View slots</Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
