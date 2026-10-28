import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "TMCC Views Monitoring", description: "Monitor Lokal page visits and video engagement." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
