import { RegisterForm } from '@/components/auth/register-form';

export const metadata = { title: 'Create account | AuthAccKit' };

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <RegisterForm />
    </>
  );
}