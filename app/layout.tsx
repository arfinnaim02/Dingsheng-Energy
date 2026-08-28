import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Dingsheng Energy Limited",
    template: "%s | Dingsheng Energy Limited",
  },
  description: "Global LPG trading, engineering, equipment supply and complete energy solutions.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
