import { Navigate } from 'react-router-dom';
import { isAdmin } from '../utils/api';

export default function Activity() {
  if (isAdmin()) return <Navigate to="/admin" replace />;
  return <div className="text-center py-16 text-zinc-500">Activity is available in the Admin Panel</div>;
}
