import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-indigo-600" aria-hidden="true" />
          <p className="text-xs font-medium text-slate-500">Checking authentication session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve the originating route in navigation state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
