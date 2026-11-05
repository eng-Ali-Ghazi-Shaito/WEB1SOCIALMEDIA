import { SocialShell } from "@/components/social-shell";

export default function SocialLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <SocialShell>{children}</SocialShell>;
}
