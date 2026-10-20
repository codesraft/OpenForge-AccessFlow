import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const metadata = { title: 'Forgot password | AuthAccKit' };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Forgot your password?</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Enter your email and we will send you a link to choose a new one.
      </p>
      <ForgotPasswordForm />
    </>
  );
}
