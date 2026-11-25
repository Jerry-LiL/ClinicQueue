import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeFor } from '../components/ProtectedRoute';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) return <p className="page-note">Loading...</p>;

  return (
    <section className="hero">
      <p className="eyebrow">Clinic desk</p>
      <h1>Book a visit. Skip the queue.</h1>
      <p className="lead">
        Patients pick a doctor and an open slot. Doctors see who is coming.
        The admin adds doctors and opens new times.
      </p>
      <ul className="points">
        <li>Patients book, reschedule and cancel their own visits.</li>
        <li>Doctors open slots and see the appointments on their list.</li>
        <li>Admins add doctor accounts and can cancel any visit.</li>
      </ul>
      {user ? (
        <Link className="button" to={homeFor(user.role)}>Continue</Link>
      ) : (
        <div className="hero-actions">
          <Link className="button" to="/register">Register as a patient</Link>
          <Link className="button secondary" to="/login">Login</Link>
        </div>
      )}
    </section>
  );
}
