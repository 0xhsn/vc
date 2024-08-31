import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "./nav";
import { ThemeProvider } from "next-themes";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Not Vercel",
  description: "Instant Deployments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
      <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <main className="flex flex-col items-center justify-center p-10">
              <div className="z-10 w-full max-w-xl flex flex-col items-center justify-center font-mono text-sm">
              <Nav />
              {children}
              </div>
            </main>
          </ThemeProvider>
      </body>
    </html>
  );
}
