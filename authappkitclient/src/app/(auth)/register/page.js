import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { RegisterForm } from '@/components/auth/register-form';
import { OrDivider } from '@/components/ui/or-divider';

export const metadata = { title: 'Create account | AuthAccKit' };

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <RegisterForm />
      <OrDivider />
      <GoogleSignInButton label="Sign up with Google" />
    </>
  );
}