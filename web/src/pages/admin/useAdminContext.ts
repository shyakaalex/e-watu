import { useOutletContext } from 'react-router-dom';
import type { AdminOutletContext } from '../../layouts/AdminLayout';

export function useAdminContext() {
  return useOutletContext<AdminOutletContext>();
}
