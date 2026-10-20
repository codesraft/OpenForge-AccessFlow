import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppHeader } from '@/components/layout/app-header';

// Every page inside the (protected) folder is wrapped, so a new page is protected by default.
export default function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <AppHeader />
      {children}
    </ProtectedRoute>
  );
}
