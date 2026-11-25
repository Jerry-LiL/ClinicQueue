import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="nav">
      <Link to="/" className="brand">ClinicQueue</Link>
      {!loading && (
        <nav>
          {!user && (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
          {user?.role === 'patient' && (
            <>
              <Link to="/doctors">Doctors</Link>
              <Link to="/appointments">My appointments</Link>
            </>
          )}
          {user?.role === 'doctor' && <Link to="/doctor">My schedule</Link>}
          {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
          {user && (
            <>
              <span className="nav-user">{user.name}</span>
              <button type="button" onClick={handleLogout}>Logout</button>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
