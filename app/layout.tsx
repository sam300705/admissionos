import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AdmissionOS | Admissions CRM",
  description: "Admissions CRM for coaching institutes and training teams.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
