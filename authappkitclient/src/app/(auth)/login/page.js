import { LoginForm } from '@/components/auth/login-form';

export const metadata = { title: 'Log in | AuthAccKit' };

export default function LoginPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
      <LoginForm />
    </>
  );
}