import type { Metadata, Viewport } from "next";
import { Grand_Hotel } from "next/font/google";
import { DemoProvider } from "@/components/demo-provider";
import { ThemeSync } from "@/components/theme-sync";
import { DEFAULT_THEME, THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const brandFont = Grand_Hotel({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "MACGRAM",
  description: "Share photos and stay close to the people you follow.",
};

// viewportFit "cover" is what makes env(safe-area-inset-*) return real values on
// iPhones; without it the tab bar sits under the home indicator.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the inline script may change data-theme before React hydrates.
    <html lang="en" className={brandFont.variable} data-theme={DEFAULT_THEME} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeSync />
        <DemoProvider>
          <div className="app-root">{children}</div>
        </DemoProvider>
      </body>
    </html>
  );
}
