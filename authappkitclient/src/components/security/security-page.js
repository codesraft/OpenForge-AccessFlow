import { ChangePasswordForm } from './change-password-form';
import { SessionsList } from './sessions-list';
import { DeleteAccountSection } from './delete-account-section';

function Section({ title, children }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function SecurityPage() {
  return (
    <main className="mx-auto w-full max-w-2xl space-y-10 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Security</h1>
      <Section title="Change password">
        <ChangePasswordForm />
      </Section>
      <Section title="Your devices">
        <SessionsList />
      </Section>
      <Section title="Delete account">
        <DeleteAccountSection />
      </Section>
    </main>
  );
}