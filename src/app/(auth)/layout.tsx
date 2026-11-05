export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="auth-page">
      <div className="auth-column">{children}</div>
      <footer className="auth-footer">© 2026 MACGRAM</footer>
    </main>
  );
}
