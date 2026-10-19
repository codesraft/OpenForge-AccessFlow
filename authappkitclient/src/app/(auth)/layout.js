// All the pages for people who are not logged in share one centred card.
export default function AuthLayout({ children }) {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-6">{children}</div>
    </main>
  );
}