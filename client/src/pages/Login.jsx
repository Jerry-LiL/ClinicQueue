import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeFor } from '../components/ProtectedRoute';
import { errorMessage } from '../api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      navigate(homeFor(user.role));
    } catch (err) {
      setError(errorMessage(err, 'Login failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card narrow">
      <h1>Login</h1>
      <p className="muted">Patients, doctors and admins sign in here. The server reads the role from the account.</p>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={busy}>{busy ? 'Please wait...' : 'Login'}</button>
      </form>
      <aside className="demo-box">
        <p><strong>Demo accounts</strong> (password is the role plus 123)</p>
        <p>Patient: rahul@clinicqueue.com / patient123</p>
        <p>Doctor: priya@clinicqueue.com / doctor123</p>
        <p>Admin: admin@clinicqueue.com / admin123</p>
      </aside>
      <p>New patient? <Link to="/register">Create an account</Link></p>
    </section>
  );
}
