import { ResendVerificationButton } from './resend-verification-button';

// Shown after signing up, because the account cannot be used until the email is confirmed.
export function CheckYourEmail({ email }) {
  return (
    <div className="space-y-4">
      <p>
        We sent a verification link to <strong>{email}</strong>. Open it to finish creating your
        account.
      </p>
      <ResendVerificationButton email={email} />
    </div>
  );
}
