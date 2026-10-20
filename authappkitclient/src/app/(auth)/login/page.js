import { LoginForm } from '@/components/auth/login-form';
import { getErrorMessage } from '@/lib/auth-errors';

export const metadata = { title: 'Log in | AuthAccKit' };

// A failed sign-in with Google sends the visitor back with ?error=... in the address.
export default async function LoginPage({ searchParams }) {
  const { error } = await searchParams;
  const initialError = error ? getErrorMessage({ code: error }) : null;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
      <LoginForm initialError={initialError} />
    </>
  );
}