import Link from 'next/link';
import { FormMessage } from '@/components/ui/form-message';

export const metadata = { title: 'Verify email | AuthAccKit' };

// The server sends people here from the email link: with ?error=... when the link is expired or was already used, and with no query params when the link is good.
export default async function VerifyEmailPage({ searchParams }) {
  const { error } = await searchParams;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Email verification</h1>
      {error ? (
        <FormMessage>
          This verification link is invalid or has expired. Log in and we will help you get a new
          one.
        </FormMessage>
      ) : (
        <FormMessage type="success">Your email is verified. You can log in now.</FormMessage>
      )}
      <Link href="/login" className="block text-center text-sm font-medium underline">
        Go to log in
      </Link>
    </>
  );
}
