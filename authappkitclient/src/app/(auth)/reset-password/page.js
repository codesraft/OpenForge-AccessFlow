import Link from 'next/link';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { FormMessage } from '@/components/ui/form-message';

export const metadata = { title: 'Reset password | AuthAccKit' };

// The server sends people here from the email link: with ?token=... when the link is good,
// and with ?error=... when it is expired or was already used.
export default async function ResetPasswordPage({ searchParams }) {
  const { token, error } = await searchParams;
  const isLinkValid = Boolean(token) && !error;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
      {isLinkValid ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="space-y-4">
          <FormMessage>This reset link is invalid or has expired.</FormMessage>
          <Link href="/forgot-password" className="block text-center text-sm font-medium underline">
            Request a new link
          </Link>
        </div>
      )}
    </>
  );
}