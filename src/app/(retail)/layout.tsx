import { Fraunces, Inter } from "next/font/google";
import "../retail.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Hambisa Retail Intelligence",
  description: "POS imports, department roll-ups, and retail performance tracking",
};

export default function RetailRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${fraunces.variable} ${inter.variable}`}>{children}</div>
  );
}
