import { Navigate, useLocation } from 'react-router-dom';
import { useAuthLoggedIn } from '../hooks/useAuthLoggedIn';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const loggedIn = useAuthLoggedIn();

  if (!loggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}
