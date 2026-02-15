import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const user = useAuthStore((s) => s.user);
  const bootstrapping = useAuthStore((s) => s.bootstrapping);

  if (bootstrapping) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}
