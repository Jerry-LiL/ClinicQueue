import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function homeFor(role) {
  if (role === 'doctor') return '/doctor';
  if (role === 'admin') return '/admin';
  return '/doctors';
}

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="page-note">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}

export function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="page-note">Loading...</p>;
  if (user) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}
